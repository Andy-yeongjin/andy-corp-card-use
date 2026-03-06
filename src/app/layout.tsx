import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "사내법인카드 관리 대시보드",
  description: "카드 사용 내역(PDF)을 엑셀로 변환하고 관리하는 시스템",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 font-sans antialiased text-slate-900">
        <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          {children}
        </main>
      </body>
    </html>
  );
}
