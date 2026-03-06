"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface FieldErrors {
  name?: string;
  email?: string;
  password?: string;
  passwordConfirm?: string;
}

function validate(name: string, email: string, password: string, passwordConfirm: string): FieldErrors {
  const errors: FieldErrors = {};

  if (!name.trim()) {
    errors.name = "이름을 입력해주세요.";
  } else if (name.trim().length < 2) {
    errors.name = "이름은 2자 이상이어야 합니다.";
  }

  if (!email) {
    errors.email = "이메일 주소를 입력해주세요.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "올바른 이메일 형식이 아닙니다. (예: name@company.com)";
  }

  if (!password) {
    errors.password = "비밀번호를 입력해주세요.";
  } else if (!/^\d{4}$/.test(password)) {
    errors.password = "비밀번호는 숫자 4자리여야 합니다. (예: 1234)";
  }

  if (!passwordConfirm) {
    errors.passwordConfirm = "비밀번호 확인을 입력해주세요.";
  } else if (password !== passwordConfirm) {
    errors.passwordConfirm = "비밀번호가 일치하지 않습니다. 다시 확인해주세요.";
  }

  return errors;
}

const pwChecks = [
  { label: "숫자 4자리", test: (pw: string) => /^\d{4}$/.test(pw) },
];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
      <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      {msg}
    </p>
  );
}

function inputClass(touched: boolean, error?: string) {
  const base = "appearance-none block w-full px-3 py-3 border rounded-xl shadow-sm placeholder-slate-400 focus:outline-none sm:text-sm transition-colors";
  if (!touched) return `${base} border-slate-300 focus:ring-blue-500 focus:border-blue-500`;
  if (error) return `${base} border-red-400 bg-red-50 focus:ring-red-400 focus:border-red-400`;
  return `${base} border-emerald-400 bg-emerald-50 focus:ring-emerald-400 focus:border-emerald-400`;
}

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  const errors = validate(name, email, password, passwordConfirm);

  const touch = (field: string) => setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true, passwordConfirm: true });

    if (Object.keys(errors).length > 0) return;

    setLoading(true);
    setServerError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const result = await response.json();

      if (result.success) {
        router.push(`/signup/verify?email=${encodeURIComponent(email)}`);
      } else {
        setServerError(result.error || "회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.");
      }
    } catch {
      setServerError("서버에 연결할 수 없습니다. 네트워크 상태를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900">
          사내법인카드 관리 시스템
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600 font-medium">
          계정을 생성하여 시작하세요.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl border border-slate-100 sm:rounded-2xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSignup} noValidate>
            {serverError && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <div className="text-sm font-medium text-red-800 text-center">{serverError}</div>
              </div>
            )}

            {/* 이름 */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-slate-700">
                이름
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => touch("name")}
                  className={inputClass(!!touched.name, errors.name)}
                  placeholder="홍길동"
                />
              </div>
              <FieldError msg={touched.name ? errors.name : undefined} />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
                이메일 주소
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={() => touch("email")}
                  className={inputClass(!!touched.email, errors.email)}
                  placeholder="name@company.com"
                />
              </div>
              <FieldError msg={touched.email ? errors.email : undefined} />
            </div>

            {/* 비밀번호 */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                비밀번호
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => touch("password")}
                  className={inputClass(!!touched.password, errors.password)}
                  placeholder="숫자 4자리 (예: 1234)"
                />
              </div>
              {/* 비밀번호 조건 체크리스트 */}
              {(touched.password || password.length > 0) && (
                <ul className="mt-2 space-y-1">
                  {pwChecks.map(({ label, test }) => {
                    const ok = test(password);
                    return (
                      <li key={label} className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-600" : "text-slate-400"}`}>
                        {ok
                          ? <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                          : <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                        }
                        {label}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* 비밀번호 확인 */}
            <div>
              <label htmlFor="passwordConfirm" className="block text-sm font-semibold text-slate-700">
                비밀번호 확인
              </label>
              <div className="mt-1">
                <input
                  id="passwordConfirm"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  onBlur={() => touch("passwordConfirm")}
                  className={inputClass(!!touched.passwordConfirm, errors.passwordConfirm)}
                  placeholder="비밀번호를 다시 입력하세요"
                />
              </div>
              <FieldError msg={touched.passwordConfirm ? errors.passwordConfirm : undefined} />
            </div>

            <div className="pt-1">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-bold text-white transition-all ${loading ? "bg-slate-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 active:scale-95"}`}
              >
                {loading ? "처리 중..." : "회원가입"}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              이미 계정이 있으신가요?{" "}
              <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500">
                로그인
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
