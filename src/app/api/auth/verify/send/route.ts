import { NextRequest, NextResponse } from "next/server";
import { bkendFetch } from "@/lib/bkend/client";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    const origin = req.nextUrl.origin;

    await bkendFetch("/auth/email/verify/send", {
      method: "POST",
      body: JSON.stringify({
        email,
        callbackUrl: `${origin}/auth/callback`,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Verify Send Error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
