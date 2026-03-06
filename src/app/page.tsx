"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";

export default function Home() {
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 실제로는 /api/auth/me 등을 호출해야 함
    // 여기서는 간단하게 로그인 상태임을 가정하고 Mock 데이터를 세팅
    setUser({
      name: "김영진",
      email: "yj.kim@company.com",
      role: "admin"
    });
    setLoading(false);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 글로벌 네비게이션 헤더 */}
      <nav className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-30 h-16 flex items-center px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">C</div>
            <span className="text-lg font-bold text-slate-900 hidden sm:block text-nowrap">CorpCard Manager</span>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex flex-col items-end mr-1">
              <span className="text-sm font-bold text-slate-800 text-nowrap">{user ? `${user.name}님` : ''}</span>
              <span className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded leading-none text-nowrap">
                {user?.role === 'admin' ? '관리자 권한' : '사용자 권한'}
              </span>
            </div>
            
            {user?.role === 'admin' ? (
              <a
                href="/users"
                className="text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 hover:border-blue-100 text-nowrap"
              >
                사용자 관리
              </a>
            ) : null}
            
            <button
              onClick={handleLogout}
              className="text-xs font-bold text-slate-500 hover:text-red-600 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-red-50 hover:border-red-100 text-nowrap"
            >
              로그아웃
            </button>
          </div>
        </div>
      </nav>

      {/* 헤더 높이만큼 띄워줌 */}
      <div className="pt-16">
        {user?.role === 'admin' ? (
          <AdminDashboard />
        ) : (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-800">준비 중인 화면입니다.</h2>
            <p className="text-slate-500 mt-2">일반 사용자용 상세 페이지는 현재 개발 중입니다.</p>
          </div>
        )}
      </div>
    </div>
  );
}
