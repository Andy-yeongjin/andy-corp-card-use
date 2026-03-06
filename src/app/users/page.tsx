"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface BkendUser {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<BkendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/users");
      const result = await res.json();
      if (result.success) {
        setUsers(result.users);
      } else {
        setError(result.error || "사용자 목록을 불러오지 못했습니다.");
      }
    } catch {
      setError("서버에 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRoleChange = async (user: BkendUser) => {
    const newRole = user.role === "admin" ? "user" : "admin";
    if (!confirm(`"${user.name || user.email}" 역할을 ${newRole === "admin" ? "관리자" : "사용자"}로 변경하시겠습니까?`)) return;
    setChangingRoleId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, role: newRole } : u));
      } else {
        alert(`변경 실패: ${result.error}`);
      }
    } catch {
      alert("오류가 발생했습니다.");
    } finally {
      setChangingRoleId(null);
    }
  };

  const handleDelete = async (user: BkendUser) => {
    if (!confirm(`정말로 "${user.name || user.email}" 계정을 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) return;
    setDeletingId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const result = await res.json();
      if (result.success) {
        setUsers((prev) => prev.filter((u) => u.id !== user.id));
      } else {
        alert(`삭제 실패: ${result.error}`);
      }
    } catch {
      alert("삭제 중 오류가 발생했습니다.");
    } finally {
      setDeletingId(null);
    }
  };

  const roleLabel = (role: string) => {
    if (role === "admin") return { text: "관리자", cls: "bg-blue-100 text-blue-700" };
    return { text: "사용자", cls: "bg-slate-100 text-slate-600" };
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <nav className="bg-white border-b border-slate-200 fixed top-0 left-0 right-0 z-30 h-16 flex items-center px-4 sm:px-8 shadow-sm">
        <div className="max-w-7xl mx-auto w-full flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-black text-sm">C</div>
              <span className="text-lg font-bold text-slate-900 hidden sm:block">CorpCard Manager</span>
            </Link>
            <span className="text-slate-300">/</span>
            <span className="text-sm font-semibold text-slate-700">사용자 관리</span>
          </div>
          <Link href="/" className="text-xs font-bold text-slate-500 hover:text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
            대시보드로 돌아가기
          </Link>
        </div>
      </nav>

      <div className="pt-16 px-4 sm:px-8 max-w-4xl mx-auto">
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">사용자 관리</h1>
              <p className="text-sm text-slate-500 mt-1">
                {loading ? "불러오는 중..." : `총 ${users.length}명`}
              </p>
            </div>
            <Link
              href="/signup"
              className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
            >
              + 사용자 추가
            </Link>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">{error}</div>
          )}

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-10 h-10 border-4 border-slate-100 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : users.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-400 text-sm">등록된 사용자가 없습니다.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">이메일</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">권한</th>
                    <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider">가입일</th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => {
                    const { text, cls } = roleLabel(user.role);
                    return (
                      <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-semibold text-slate-800">
                          {user.name || "-"}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cls}`}>{text}</span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-400">
                          {new Date(user.createdAt).toLocaleDateString("ko-KR")}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRoleChange(user)}
                            disabled={changingRoleId === user.id}
                            className="text-xs font-semibold text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {changingRoleId === user.id ? "변경 중..." : user.role === "admin" ? "→ 사용자" : "→ 관리자"}
                          </button>
                          <button
                            onClick={() => handleDelete(user)}
                            disabled={deletingId === user.id}
                            className="text-xs font-semibold text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-40"
                          >
                            {deletingId === user.id ? "삭제 중..." : "삭제"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
