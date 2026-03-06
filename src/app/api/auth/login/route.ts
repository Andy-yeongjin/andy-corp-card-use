import { NextRequest, NextResponse } from "next/server";
import { bkendAuth } from "@/lib/bkend/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    const result = await bkendAuth.login(email, `Pin#${password}`);

    if (!result.success) {
      const code = result.error?.code || "";
      const isUnverified = code === "auth/email-not-verified" || code === "auth/unverified-email";
      return NextResponse.json(
        {
          success: false,
          error: isUnverified
            ? "이메일 인증이 완료되지 않았습니다. 받은 편지함에서 인증 링크를 클릭해주세요."
            : result.error?.message || "이메일 또는 비밀번호가 올바르지 않습니다.",
          unverified: isUnverified,
          email: isUnverified ? email : undefined,
        },
        { status: 401 }
      );
    }

    const { accessToken, refreshToken, expiresIn, user } = result.data;

    if (!accessToken) {
      return NextResponse.json({ success: false, error: "Access token is missing in response" }, { status: 500 });
    }

    const response = NextResponse.json({ success: true, user });

    response.cookies.set("bkend_access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: expiresIn,
    });

    response.cookies.set("bkend_refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 2592000,
    });

    return response;
  } catch (error: any) {
    console.error("Auth API Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
