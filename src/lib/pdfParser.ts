import { CardTransaction } from "@/types";

/**
 * IBK기업은행 PDF 내역서에서 데이터를 추출합니다.
 */
export async function parseCardPDF(file: File, password?: string): Promise<Partial<CardTransaction>[]> {
  console.log("Starting parseCardPDF for:", file.name);
  
  if (typeof window === "undefined") return [];

  try {
    // pdfjs-dist를 동적으로 임포트 (legacy 빌드 사용으로 안정성 확보)
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    
    // 워커 설정 (unpkg 사용)
    const workerUrl = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/legacy/build/pdf.worker.min.mjs`;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    console.log("PDF.js loaded, version:", pdfjs.version);

    const arrayBuffer = await file.arrayBuffer();
    
    const loadingTask = pdfjs.getDocument({
      data: arrayBuffer,
      password: password,
    });

    const pdf = await loadingTask.promise;
    console.log("PDF document loaded, pages:", pdf.numPages);

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => (item as any).str).join(" ");
      fullText += pageText + "\n";
    }

    console.log("Extracted Full Text Length:", fullText.length);
    console.log("Text Sample (First 1000 chars):", fullText.substring(0, 1000));

    const transactions: Partial<CardTransaction>[] = [];
    
    // IBK기업은행 이용대금명세서 추출 패턴
    // 패턴 예: 12/11 V73910 가맹점명(깨짐) 12,900 12,900 0 0
    const regex = /(\d{2}\/\d{2})\s+[A-Za-z\d]*\s+([\s\S]+?)\s+([\d,]+)\s+[\d,]+\s+0\s+0/g;
    let match;

    // 현재 연도는 파일명 또는 현재 날짜를 기반으로 추론할 수 있으나, 임시로 현재 연도 사용
    const currentYear = new Date().getFullYear();

    while ((match = regex.exec(fullText)) !== null) {
      transactions.push({
        transactionDate: `${currentYear}-${match[1].replace("/", "-")}`,
        merchantName: match[2].trim(), // 한글 깨짐 현상 존재
        amount: parseInt(match[3].replace(/,/g, ""), 10),
        approvalNumber: "-", // 이용대금명세서에는 승인번호가 없음
        status: 'parsed',
        createdAt: new Date().toISOString(),
      });
    }

    // 만약 정규표현식으로 아무것도 못 찾았다면, 텍스트 분석을 위해 로그를 남기고 빈 배열 반환
    if (transactions.length === 0) {
      console.warn("No transactions matched the regex pattern.");
    } else {
      console.log(`Successfully parsed ${transactions.length} transactions.`);
    }

    return transactions;
  } catch (error: any) {
    console.error("Detailed PDF Parsing Error:", error);
    if (error.name === "PasswordException") {
      throw new Error("PDF 암호가 틀렸습니다. 사업자번호 10자리를 확인해주세요.");
    }
    throw new Error(`PDF 파싱 실패: ${error.message}`);
  }
}
