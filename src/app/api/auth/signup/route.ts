import { NextRequest, NextResponse } from "next/server";
import { bkendFetch } from "@/lib/bkend/client";

function parseJwtSub(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(Buffer.from(payload, "base64url").toString());
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();

    const result = await bkendFetch("/auth/email/signup", {
      method: "POST",
      body: JSON.stringify({ method: "password", email, password: `Pin#${password}`, name }),
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error?.message || "회원가입에 실패했습니다." },
        { status: 400 }
      );
    }

    const { accessToken } = result.data;
    const authId = accessToken ? parseJwtSub(accessToken) : null;

    // ap_user 적재
    await bkendFetch("/data/ap_user", {
      method: "POST",
      token: accessToken,
      body: JSON.stringify({ name, email, role: "user", authId }),
    }).catch((err) => console.error("ap_user insert failed:", err.message));

    // 이메일 인증 메일 발송
    const origin = req.nextUrl.origin;
    await bkendFetch("/auth/email/verify/send", {
      method: "POST",
      body: JSON.stringify({ email, callbackUrl: `${origin}/auth/callback` }),
    }).catch((err) => console.error("Verification email failed:", err.message));

    // 자동 로그인 안 함 - 인증 후 로그인 필요
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Signup API Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
