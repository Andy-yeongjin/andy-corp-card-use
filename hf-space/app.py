from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse
import easyocr
import fitz
import numpy as np
from PIL import Image
import io
import re
import logging

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("OCR-ENGINE")

app = FastAPI()
reader = easyocr.Reader(['ko', 'en'])

def clean_amount(s):
    s = s.replace('O', '0').replace('o', '0').replace('Q', '0')
    nums = re.sub(r'[^\d]', '', s)
    return int(nums) if nums else 0

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/extract")
async def extract(file: UploadFile = File(...), password: str = Form("")):
    logger.info(f"--- New Request: {file.filename} ---")
    
    try:
        content = await file.read()
        doc = fitz.open(stream=content, filetype="pdf")
        
        if doc.is_encrypted:
            logger.info("PDF is encrypted. Authenticating...")
            if not doc.authenticate(password):
                logger.error("Authentication failed: Invalid password")
                return JSONResponse({"success": False, "error": "Invalid PDF password"}, status_code=401)
        
        logger.info(f"PDF loaded successfully. Total pages: {len(doc)}")
        
        all_transactions = []
        target_total_amount = 0
        
        # 1. 1페이지 총액 분석
        logger.info("Step 1: Analyzing page 1 for total billing amount...")
        page1 = doc[0]
        mat = fitz.Matrix(3.0, 3.0)
        pix = page1.get_pixmap(matrix=mat)
        img1 = Image.open(io.BytesIO(pix.tobytes("png")))
        results1 = reader.readtext(np.array(img1))
        
        found_label = False
        for (_, text, _) in results1:
            clean_text = text.replace(" ", "")
            if "결제하실금액" in clean_text:
                found_label = True
                continue
            if found_label:
                val = clean_amount(text)
                if val > 0:
                    target_total_amount = val
                    logger.info(f"Total billing amount found: {target_total_amount}")
                    break

        # 2. 상세 내역 분석 (2페이지부터)
        logger.info("Step 2: Extracting transaction details from page 2 onwards...")
        for page_idx in range(1, len(doc)):
            logger.info(f"Processing page {page_idx + 1}...")
            page = doc[page_idx]
            pix = page.get_pixmap(matrix=mat)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            results = reader.readtext(np.array(img))
            
            rows = {}
            for (bbox, text, _) in results:
                y_center = (bbox[0][1] + bbox[2][1]) // 2
                found_row = False
                for r_y in rows.keys():
                    if abs(r_y - y_center) < 25:
                        rows[r_y].append((bbox[0][0], text))
                        found_row = True
                        break
                if not found_row:
                    rows[y_center] = [(bbox[0][0], text)]
            
            page_count = 0
            for y in sorted(rows.keys()):
                line_items = sorted(rows[y], key=lambda x: x[0])
                line_text = " ".join([item[1] for item in line_items])
                
                regex = r'(\d{2}/\d{2})\s+[A-Za-z0-9]+\s+(.*?)\s+([0-9,OoQ]{2,})\s+[0-9,OoQ]{2,}'
                match = re.search(regex, line_text)
                if match:
                    merchant_full = match.group(2)
                    merchant = re.split(r'서울|경기|인천|강원|충북|충남|전북|전남|경북|경남|제주|세종|#', merchant_full)[0].strip()
                    amount = clean_amount(match.group(3))
                    
                    if amount > 0:
                        all_transactions.append({
                            "transactionDate": f"2025-{match.group(1).replace('/', '-')}",
                            "merchantName": merchant,
                            "amount": amount,
                            "status": "parsed"
                        })
                        page_count += 1
            logger.info(f"Page {page_idx + 1}: Found {page_count} transactions.")

        doc.close()
        logger.info(f"--- Extraction Complete! Total: {len(all_transactions)} items ---")
        
        return {
            "success": True, 
            "data": all_transactions,
            "targetTotalAmount": target_total_amount
        }

    except Exception as e:
        logger.exception("Unexpected error during extraction")
        return JSONResponse({"success": False, "error": str(e)}, status_code=500)
