"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    if (!email || countdown > 0) return;
    setResending(true);
    setResendMsg(null);
    try {
      const res = await fetch("/api/auth/verify/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (result.success) {
        setResendMsg({ type: "success", text: "인증 메일을 재발송했습니다." });
        setCountdown(60);
      } else {
        setResendMsg({ type: "error", text: result.error || "재발송에 실패했습니다." });
      }
    } catch {
      setResendMsg({ type: "error", text: "서버에 연결할 수 없습니다." });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900">
          이메일을 확인해주세요
        </h2>
        <p className="mt-3 text-center text-sm text-slate-500">
          아래 주소로 인증 링크를 발송했습니다.
        </p>
        {email && (
          <p className="mt-1 text-center text-sm font-semibold text-slate-800">{email}</p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10 space-y-5">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700 space-y-2">
            <p className="font-semibold">다음 단계를 따라주세요</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-600">
              <li>이메일 받은 편지함을 확인하세요.</li>
              <li>메일 내 <span className="font-semibold">"이메일 인증하기"</span> 링크를 클릭하세요.</li>
              <li>인증 완료 후 로그인 페이지로 이동합니다.</li>
            </ol>
          </div>

          {resendMsg && (
            <div className={`rounded-xl p-3 text-sm text-center font-medium ${resendMsg.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {resendMsg.text}
            </div>
          )}

          <div className="text-center">
            <p className="text-xs text-slate-400 mb-3">메일이 오지 않았나요? 스팸함도 확인해보세요.</p>
            <button
              onClick={handleResend}
              disabled={resending || countdown > 0}
              className={`w-full py-2.5 px-4 rounded-xl border text-sm font-semibold transition-all ${resending || countdown > 0 ? "border-slate-200 text-slate-400 cursor-not-allowed" : "border-blue-300 text-blue-600 hover:bg-blue-50"}`}
            >
              {resending ? "발송 중..." : countdown > 0 ? `재발송 가능까지 ${countdown}초` : "인증 메일 재발송"}
            </button>
          </div>

          <div className="text-center pt-2 border-t border-slate-100">
            <Link href="/login" className="text-sm text-slate-500 hover:text-slate-700">
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyContent />
    </Suspense>
  );
}
