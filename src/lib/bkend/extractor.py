import easyocr
import fitz
import numpy as np
from PIL import Image
import io
import sys
import json
import re

def clean_amount(s):
    # O, o, Q 등 OCR이 0으로 잘못 읽는 글자들을 0으로 치환
    s = s.replace('O', '0').replace('o', '0').replace('Q', '0')
    # 숫자 이외의 모든 글자 제거
    nums = re.sub(r'[^\d]', '', s)
    return int(nums) if nums else 0

def extract_transactions(pdf_path, password):
    try:
        doc = fitz.open(pdf_path)
        if doc.is_encrypted:
            if not doc.authenticate(password):
                return {"success": False, "error": "Invalid PDF password"}
        
        reader = easyocr.Reader(['ko', 'en'])
        all_transactions = []
        target_total_amount = 0
        
        # 1. 1페이지에서 '결제하실 금액' 추출
        page1 = doc[0]
        mat = fitz.Matrix(3.0, 3.0)
        pix = page1.get_pixmap(matrix=mat)
        img1 = Image.open(io.BytesIO(pix.tobytes("png")))
        results1 = reader.readtext(np.array(img1))
        
        found_label = False
        for (bbox, text, prob) in results1:
            clean_text = text.replace(" ", "")
            if "결제하실금액" in clean_text:
                found_label = True
                continue
            if found_label:
                # 라벨 바로 뒤에 오는 숫자를 총액으로 간주
                val = clean_amount(text)
                if val > 0:
                    target_total_amount = val
                    break

        # 2. 2페이지부터 상세 내역 추출
        for page_index in range(1, len(doc)):
            page = doc[page_index]
            pix = page.get_pixmap(matrix=mat)
            img = Image.open(io.BytesIO(pix.tobytes("png")))
            results = reader.readtext(np.array(img))
            
            rows = {}
            for (bbox, text, prob) in results:
                y_center = (bbox[0][1] + bbox[2][1]) // 2
                found_row = False
                for r_y in rows.keys():
                    if abs(r_y - y_center) < 25:
                        rows[r_y].append((bbox[0][0], text))
                        found_row = True
                        break
                if not found_row:
                    rows[y_center] = [(bbox[0][0], text)]
            
            for y in sorted(rows.keys()):
                line_items = sorted(rows[y], key=lambda x: x[0])
                line_text = " ".join([item[1] for item in line_items])
                
                regex = r'(\d{2}/\d{2})\s+[A-Za-z0-9]+\s+(.*?)\s+([0-9,OoQ]{2,})\s+[0-9,OoQ]{2,}'
                match = re.search(regex, line_text)
                
                if match:
                    date_str = match.group(1)
                    merchant_full = match.group(2)
                    merchant = re.split(r'서울|경기|인천|강원|충북|충남|전북|전남|경북|경남|제주|세종|#', merchant_full)[0].strip()
                    amount = clean_amount(match.group(3))
                    
                    if amount > 0:
                        all_transactions.append({
                            "transactionDate": f"2025-{date_str.replace('/', '-')}",
                            "merchantName": merchant,
                            "amount": amount,
                            "approvalNumber": "-",
                            "status": "parsed"
                        })
        
        doc.close()
        return {
            "success": True, 
            "data": all_transactions,
            "targetTotalAmount": target_total_amount
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    if sys.stdout.encoding != 'utf-8':
        import io
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

    if len(sys.argv) < 3:
        print(json.dumps({"success": False, "error": "Missing arguments"}))
        sys.exit(1)
        
    path = sys.argv[1]
    pwd = sys.argv[2]
    
    result = extract_transactions(path, pwd)
    print(json.dumps(result, ensure_ascii=False))
