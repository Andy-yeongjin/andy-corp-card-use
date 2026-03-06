import ExcelJS from "exceljs";
import { CardTransaction } from "@/types";

/**
 * 사내 표준 엑셀 양식에 맞춰 거래 내역을 엑셀 파일로 생성합니다.
 * 파일명 형식: 법인카드사용내역서_YYYYMM_이름.xlsx
 */
export async function generateExcel(transactions: CardTransaction[], yearMonth: string, userName: string): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(`${yearMonth} 사용내역`);

  // 헤더 설정 및 스타일 (부서, 승인번호 제외)
  sheet.columns = [
    { header: "연번", key: "index", width: 10 },
    { header: "사용일자", key: "transactionDate", width: 20 },
    { header: "가맹점명", key: "merchantName", width: 40 },
    { header: "금액", key: "amount", width: 20 },
    { header: "사용근거", key: "purpose", width: 30 },
    { header: "참석자", key: "participants", width: 30 },
    { header: "사용자", key: "userName", width: 15 },
  ];

  // 헤더 스타일 적용
  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2C3E50' } // #2c3e50
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  // 데이터 추가
  transactions.forEach((tx, idx) => {
    sheet.addRow({
      index: idx + 1,
      transactionDate: tx.transactionDate,
      merchantName: tx.merchantName,
      amount: tx.amount,
      purpose: tx.purpose || "",
      participants: tx.participants || "",
      userName: userName,
    });
  });

  // 합계 행 추가 (데이터 행 바로 아래)
  const lastRowNumber = transactions.length + 1;
  const totalRow = sheet.addRow({
    merchantName: "합 계",
    amount: { formula: `SUM(D2:D${lastRowNumber})`, result: transactions.reduce((s, t) => s + (t.amount || 0), 0) },
  });

  // 합계 행 스타일 (Bold)
  totalRow.eachCell((cell) => {
    cell.font = { bold: true };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF9F9F9' }
    };
  });

  // 금액 컬럼 천단위 콤마 설정
  sheet.getColumn('amount').numFmt = '#,##0';

  // 모든 셀 테두리 설정
  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  // 파일 생성 및 Blob 반환
  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

/**
 * 브라우저에서 엑셀 파일을 다운로드합니다.
 */
export function downloadExcel(blob: Blob, yearMonth: string, userName: string) {
  const fileName = `법인카드사용내역서_${yearMonth}_${userName}.xlsx`;
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", fileName);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
