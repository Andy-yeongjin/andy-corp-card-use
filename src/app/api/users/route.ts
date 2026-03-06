import { NextRequest, NextResponse } from "next/server";
import { bkendFetch } from "@/lib/bkend/client";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get("bkend_access_token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });

    const result = await bkendFetch("/data/ap_user?limit=100&sortBy=createdAt&sortDirection=desc", { token });
    
    // 타입 에러 방지를 위해 data 내부의 items에 안전하게 접근
    const users = result.data?.items || [];
    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
