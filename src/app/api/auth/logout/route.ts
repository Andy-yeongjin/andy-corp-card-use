import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ success: true });

  // 쿠키 삭제
  response.cookies.delete("bkend_access_token");
  response.cookies.delete("bkend_refresh_token");

  return response;
}
