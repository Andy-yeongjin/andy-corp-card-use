import { NextRequest, NextResponse } from "next/server";
import { bkendFetch } from "@/lib/bkend/client";

/**
 * DB에서 거래 내역 조회
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("bkend_access_token")?.value;
    const result = await bkendFetch("/data/transactions", {
      token,
      cache: 'no-store'
    });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("GET Transactions Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * DB에 거래 내역 저장 (성공했던 테스트 방식 그대로 이식)
 */
export async function POST(req: NextRequest) {
  try {
    const { transactions } = await req.json();
    const token = req.cookies.get("bkend_access_token")?.value;

    if (!token) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });

    // 1. 현재 사용자 이메일 획득
    const userResult = await bkendFetch("/auth/me", { token });
    if (!userResult.success) throw new Error("User session invalid");
    const userEmail = userResult.data.email;

    const savedResults = [];

    // 2. 루프를 돌며 개별 전송
    for (const tx of transactions) {
      const payload = {
        email: String(userEmail),
        transactionDate: String(tx.transactionDate || ""),
        merchantName: String(tx.merchantName || ""),
        amount: Math.floor(Number(tx.amount)),
        purpose: String(tx.purpose || ""),
        participants: String(tx.participants || "")
      };

      const res = await bkendFetch("/data/transactions", {
        method: "POST",
        body: JSON.stringify(payload),
        token,
      });

      if (res && res.success !== false) {
        savedResults.push(res.data ?? res);
      } else {
        const errMsg = typeof res?.error === "string"
          ? res.error
          : res?.error?.message || "bkend 저장 실패";
        console.error("Single row save failed:", res?.error);
        throw new Error(errMsg);
      }
    }

    return NextResponse.json({ 
      success: true, 
      count: savedResults.length
    });

  } catch (error: any) {
    console.error("POST Transactions Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
