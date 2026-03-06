"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function CallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    // bkend는 인증 성공 시 ?verified=true&email=..., 실패 시 ?error=...&error_description=... 를 붙여 리다이렉트
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");
    const errorDescription = searchParams.get("error_description");

    if (verified === "true") {
      setStatus("success");
      const t = setTimeout(() => router.push("/login"), 3000);
      return () => clearTimeout(t);
    } else if (error) {
      setStatus("error");
      setErrorMsg(errorDescription || "이메일 인증에 실패했습니다. 링크가 만료되었거나 이미 사용된 링크입니다.");
    } else {
      // 파라미터가 없으면 잠시 대기 후 판단 (bkend 리다이렉트 지연 대응)
      const t = setTimeout(() => {
        setStatus("error");
        setErrorMsg("인증 결과를 확인할 수 없습니다. 다시 시도해주세요.");
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [searchParams, router]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-slate-500 text-sm">인증을 처리하고 있습니다...</p>
      </div>
    );
  }

  if (status === "success") {
    return (
      <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <h2 className="text-center text-2xl font-extrabold text-slate-900">이메일 인증 완료!</h2>
          <p className="mt-3 text-center text-sm text-slate-500">
            계정 인증이 완료되었습니다. 3초 후 로그인 페이지로 이동합니다.
          </p>
        </div>
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-10 shadow-xl border border-slate-100 sm:rounded-2xl text-center">
            <Link
              href="/login"
              className="inline-block w-full py-3 px-4 rounded-xl bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition-all"
            >
              지금 로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
        <h2 className="text-center text-2xl font-extrabold text-slate-900">인증에 실패했습니다</h2>
        <p className="mt-3 text-center text-sm text-slate-500">{errorMsg}</p>
      </div>
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-10 shadow-xl border border-slate-100 sm:rounded-2xl space-y-3 text-center">
          <Link
            href="/signup/verify"
            className="block w-full py-3 px-4 rounded-xl border border-blue-300 text-blue-600 text-sm font-semibold hover:bg-blue-50 transition-all"
          >
            인증 메일 재발송
          </Link>
          <Link
            href="/login"
            className="block text-sm text-slate-400 hover:text-slate-600"
          >
            로그인 페이지로 돌아가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense>
      <CallbackContent />
    </Suspense>
  );
}
