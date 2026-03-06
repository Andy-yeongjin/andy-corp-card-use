"use client";

import { useState, useCallback, useMemo } from "react";
import { generateExcel, downloadExcel } from "@/lib/excelGenerator";
import { CardTransaction } from "@/types";

interface UploadFormProps {
  onSaveSuccess?: () => void;
  onConversionSuccess?: (data: CardTransaction[], targetAmount?: number) => void;
}

export default function UploadForm({ 
  onSaveSuccess, 
  onConversionSuccess 
}: UploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'success' | 'error'>('idle');
  const [parsedCount, setParsedCount] = useState(0);
  const [transactions, setTransactions] = useState<Partial<CardTransaction>[]>([]);
  const [targetAmount, setTargetAmount] = useState<number | undefined>(undefined);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setStatus('idle');
    setTransactions([]); 
    setTargetAmount(undefined);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    
    setStatus('parsing');
    setTransactions([]);
    
    try {
      const fileName = file.name;
      const match = fileName.match(/(\d{6}).*_(\D+)\.pdf/);
      const yearMonth = match ? match[1] : "202601";
      const userName = match ? match[2] : "김영진";

      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", process.env.NEXT_PUBLIC_PDF_PASSWORD || "3658801146");

      const response = await fetch("/api/parse-pdf", { method: "POST", body: formData });
      const result = await response.json();

      if (!result.success) throw new Error(result.error);

      setParsedCount(result.data.length);
      setTransactions(result.data);
      setTargetAmount(result.targetTotalAmount);
      
      onConversionSuccess?.(result.data, result.targetTotalAmount);
      setStatus('success');
    } catch (error: any) {
      console.error("OCR failed:", error);
      setStatus('error');
      alert(`OCR 분석 실패: ${error.message}`);
    }
  };

  const handleDownload = async () => {
    if (transactions.length === 0) return;
    
    const fileName = file?.name || "";
    const match = fileName.match(/(\d{6}).*_(\D+)\.pdf/);
    const yearMonth = match ? match[1] : "202601";
    const userName = match ? match[2] : "김영진";
    
    const excelBlob = await generateExcel(transactions as CardTransaction[], yearMonth, userName);
    downloadExcel(excelBlob, yearMonth, userName);
  };

  const handleSave = async () => {
    if (transactions.length === 0) return;
    
    const currentTotal = transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    if (targetAmount !== undefined && currentTotal !== targetAmount) {
      alert("명세서 총액과 현재 합계가 일치하지 않아 저장할 수 없습니다.");
      return;
    }

    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactions }),
      });

      const result = await response.json();

      if (!result.success) throw new Error(result.error || "저장 실패");

      alert(`성공적으로 저장되었습니다! (총 ${transactions.length}건)`);
      onSaveSuccess?.();
    } catch (error: any) {
      console.error("Save failed:", error);
      alert(`저장 중 오류가 발생했습니다: ${error.message}`);
    }
  };

  const updateTransaction = useCallback((index: number, field: keyof CardTransaction, value: string | number) => {
    setTransactions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      
      // Update parent immediately after state update
      onConversionSuccess?.(updated as CardTransaction[], targetAmount);
      return updated;
    });
  }, [onConversionSuccess, targetAmount]);

  const handleFillMock = useCallback(() => {
    const mockResults = [
      { transactionDate: "2025-12-03", merchantName: "(주)우아한형제들", amount: 5000, purpose: "식비(중식)", participants: "김영진" },
      { transactionDate: "2025-12-12", merchantName: "방이옥", amount: 1079000, purpose: "팀 회식", participants: "개발팀 전원" },
      { transactionDate: "2025-12-31", merchantName: "창고43", amount: 200000, purpose: "연말 마감 식사", participants: "김영진 외 1명" }
    ];
    setTransactions(mockResults);
    setParsedCount(mockResults.length);
    setTargetAmount(1284000); 
    setStatus('success');
    onConversionSuccess?.(mockResults as any, 1284000);
  }, [onConversionSuccess]);

  // Derived state calculated during render
  const currentCalculatedTotal = useMemo(() => 
    transactions.reduce((sum, tx) => sum + (tx.amount || 0), 0),
  [transactions]);

  const isMismatch = targetAmount !== undefined && currentCalculatedTotal !== targetAmount;

  return (
    <div className="relative">
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-300 ${status === 'parsing' ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
        <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
          <span className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </span>
          카드 사용 내역 업로드
        </h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-stretch border-b border-slate-100 pb-6 mb-6">
          <div className="flex-1 relative group">
            <div className={`h-12 flex items-center px-4 rounded-xl border-2 border-dashed transition-colors ${file ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-slate-50 group-hover:border-slate-300'}`}>
              <span className={`text-sm ${file ? 'text-blue-700 font-medium' : 'text-slate-400'}`}>
                {file ? `📄 ${file.name}` : "여기에 PDF 파일을 드래그하거나 선택하세요"}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="fileInput" />
            <label htmlFor="fileInput" className="cursor-pointer h-12 flex items-center px-6 rounded-xl bg-slate-100 text-slate-600 font-semibold text-sm hover:bg-slate-200 transition-colors">
              파일 찾기
            </label>
            <button 
              onClick={handleUpload} 
              disabled={!file || status === 'parsing'}
              className={`h-12 px-8 rounded-xl font-bold text-sm shadow-lg shadow-blue-200/50 transition-all ${!file ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'}`}
            >
              {status === 'parsing' ? '분석 중...' : '변환 시작하기'}
            </button>

            {process.env.NODE_ENV === 'development' ? (
              <button 
                type="button"
                onClick={handleFillMock}
                className="h-12 px-4 rounded-xl border border-dashed border-amber-400 text-amber-600 font-bold text-xs hover:bg-amber-50 transition-all"
              >
                🛠️ 테스트 데이터 채우기
              </button>
            ) : null}
          </div>
        </div>

        {status === 'success' ? (
          <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl p-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center text-emerald-700 text-sm font-semibold">
              <svg className="w-5 h-5 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              분석 완료! 총 {parsedCount}건의 내역을 찾았습니다.
            </div>
            {targetAmount !== undefined ? (
              <div className="text-emerald-800 text-sm bg-white px-3 py-1 rounded-lg border border-emerald-200 shadow-sm">
                명세서 청구 총액: <span className="font-bold">{targetAmount.toLocaleString()}원</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {status === 'parsing' ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center animate-in fade-in duration-300">
          <div className="w-16 h-16 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin mb-4"></div>
          <h3 className="text-lg font-bold text-slate-800">인공지능 분석 중...</h3>
          <p className="text-slate-500 text-sm mt-2 text-center text-balance">
            1페이지의 청구 총액과<br/>
            2페이지 이후의 상세 내역을 대조 분석하고 있습니다.
          </p>
        </div>
      ) : null}

      {transactions.length > 0 ? (
        <div className="mt-8 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800">데이터 검수 및 수정</h3>
              <p className="text-xs text-slate-500 mt-1">상단의 계산된 총액과 명세서 총액이 일치하는지 확인하세요.</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={handleSave} 
                disabled={isMismatch || transactions.length === 0}
                className={`px-4 h-10 rounded-lg font-bold text-xs transition-all ${isMismatch ? 'bg-red-50 text-red-400 cursor-not-allowed opacity-70' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {isMismatch ? '금액 불일치로 저장 불가' : 'DB에 저장'}
              </button>
              <button onClick={handleDownload} className="px-4 h-10 rounded-lg bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all shadow-md shadow-slate-200">
                엑셀 다운로드
              </button>
            </div>
          </div>
          
          {isMismatch ? (
            <div className="px-6 py-3 bg-red-50 border-b border-red-100">
              <p className="text-xs text-red-600 flex items-center font-medium">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                명세서 총액({targetAmount?.toLocaleString()}원)과 현재 합계({currentCalculatedTotal.toLocaleString()}원)가 일치해야 저장할 수 있습니다. (차액: {(targetAmount! - currentCalculatedTotal).toLocaleString()}원)
              </p>
            </div>
          ) : null}
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100" style={{ width: '140px' }}>날짜</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100" style={{ minWidth: '350px' }}>가맹점명</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right" style={{ width: '130px' }}>금액</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100" style={{ width: '200px' }}>사용근거</th>
                  <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100" style={{ width: '180px' }}>참석자</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map((tx, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/30 transition-colors group">
                    <td className="px-4 py-2 text-sm text-slate-600">
                      <input 
                        type="text" 
                        value={tx.transactionDate} 
                        onChange={(e) => updateTransaction(idx, 'transactionDate', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-transparent transition-all outline-none" 
                      />
                    </td>
                    <td className="px-4 py-2 text-sm text-slate-800 font-medium">
                      <input 
                        type="text" 
                        value={tx.merchantName} 
                        onChange={(e) => updateTransaction(idx, 'merchantName', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-transparent transition-all outline-none" 
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        value={tx.amount?.toLocaleString()} 
                        onChange={(e) => updateTransaction(idx, 'amount', parseInt(e.target.value.replace(/,/g, ''), 10) || 0)}
                        className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-transparent transition-all text-sm text-slate-900 font-bold text-right outline-none" 
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        placeholder="예: 식비(중식)" 
                        value={tx.purpose || ''} 
                        onChange={(e) => updateTransaction(idx, 'purpose', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-transparent transition-all text-sm text-slate-600 outline-none" 
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input 
                        type="text" 
                        placeholder="참석자 입력" 
                        value={tx.participants || ''} 
                        onChange={(e) => updateTransaction(idx, 'participants', e.target.value)}
                        className="w-full px-2 py-1.5 rounded-lg border border-transparent hover:border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-transparent transition-all text-sm text-slate-600 outline-none" 
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
