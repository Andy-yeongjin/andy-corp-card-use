"use client";

import { Statistics, CardTransaction } from "@/types";
import { useState, useEffect, useCallback, useMemo } from "react";
import UploadForm from "./UploadForm";

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<CardTransaction[]>([]);
  const [targetAmount, setTargetAmount] = useState<number | undefined>(undefined);
  
  const [stats, setStats] = useState<Statistics>(() => ({
    totalAmount: 0,
    transactionCount: 0,
    departmentStats: {}
  }));

  // 데이터를 바탕으로 통계 계산
  const calculateStats = useCallback((data: CardTransaction[]) => {
    const total = data.reduce((sum, tx) => sum + (tx.amount || 0), 0);
    setStats({
      totalAmount: total,
      transactionCount: data.length,
      departmentStats: {}
    });
  }, []);

  // 데이터 로드 함수
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/transactions");
      const response = await res.json();

      let data: CardTransaction[] = [];
      if (response.success && Array.isArray(response.data)) {
        data = response.data;
        setError(null);
      }

      setTransactions(data);
      calculateStats(data);
    } catch (err: any) {
      console.warn("백엔드 데이터 조회 실패 (데이터가 없거나 연결 오류):", err.message);
      setTransactions([]);
      calculateStats([]);
    } finally {
      setLoading(false);
    }
  }, [calculateStats]);

  // 즉시 통계 업데이트를 위한 함수
  const setImmediateTransactions = useCallback((newTransactions: CardTransaction[], newTargetAmount?: number) => {
    setTransactions(newTransactions);
    calculateStats(newTransactions);
    if (newTargetAmount !== undefined) {
      setTargetAmount(newTargetAmount);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Derived state calculated during render
  const isAmountMismatch = useMemo(() => 
    targetAmount !== undefined && stats.totalAmount !== targetAmount,
  [targetAmount, stats.totalAmount]);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">법인카드 대시보드</h1>
          <p className="mt-2 text-sm text-slate-500">사내 법인카드 사용 내역을 통합 관리하고 엑셀 보고서를 생성합니다.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium text-slate-600 text-nowrap">시스템 정상</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-2">
        <div className={`overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border transition-colors sm:p-6 ${isAmountMismatch ? 'border-red-200 bg-red-50/30' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between">
            <dt className="truncate text-sm font-medium text-slate-500">총 사용 금액 (이번 달)</dt>
            {targetAmount !== undefined ? (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isAmountMismatch ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {isAmountMismatch ? '금액 불일치' : '금액 일치'}
              </span>
            ) : null}
          </div>
          <dd className="mt-1 flex items-baseline justify-between gap-2 flex-wrap">
            <div className="text-3xl font-semibold tracking-tight text-slate-900">
              {stats.totalAmount.toLocaleString()}원
            </div>
            {targetAmount !== undefined ? (
              <div className="text-sm text-slate-500">
                명세서 총액: {targetAmount.toLocaleString()}원
              </div>
            ) : null}
          </dd>
          {isAmountMismatch ? (
            <p className="mt-2 text-xs text-red-500 font-medium">
              ※ 상세 내역 합계가 명세서 총액과 {(targetAmount! - stats.totalAmount).toLocaleString()}원 차이납니다.
            </p>
          ) : null}
        </div>
        
        <div className="overflow-hidden rounded-xl bg-white px-4 py-5 shadow-sm border border-slate-200 sm:p-6">
          <dt className="truncate text-sm font-medium text-slate-500">총 사용 건수</dt>
          <dd className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">{stats.transactionCount}건</dd>
        </div>
      </div>

      <UploadForm 
        onSaveSuccess={fetchData} 
        onConversionSuccess={setImmediateTransactions}
      />
    </div>
  );
}
