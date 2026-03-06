import { NextRequest, NextResponse } from "next/server";
import { bkendFetch } from "@/lib/bkend/client";

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.cookies.get("bkend_access_token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });

    // ap_user 레코드 조회 → authId 추출
    const record = await bkendFetch(`/data/ap_user/${id}`, { token });
    const authId = record.data?.authId;

    // ap_user 삭제
    await bkendFetch(`/data/ap_user/${id}`, { method: "DELETE", token });

    // bkend auth 유저도 삭제 (authId 있을 경우)
    if (authId) {
      await fetch(`${process.env.NEXT_PUBLIC_BKEND_API_URL}/v1/users/${authId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
          "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
          "X-API-Key": process.env.BKEND_API_KEY!,
          "Authorization": `Bearer ${token}`,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.cookies.get("bkend_access_token")?.value;
    if (!token) return NextResponse.json({ success: false, error: "Auth required" }, { status: 401 });

    const { role } = await req.json();

    // ap_user role 업데이트
    await bkendFetch(`/data/ap_user/${id}`, {
      method: "PATCH",
      token,
      body: JSON.stringify({ role }),
    });

    // bkend auth role도 동기화
    const record = await bkendFetch(`/data/ap_user/${id}`, { token });
    const authId = record.data?.authId;
    if (authId) {
      await fetch(`${process.env.NEXT_PUBLIC_BKEND_API_URL}/v1/users/${authId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Project-Id": process.env.NEXT_PUBLIC_BKEND_PROJECT_ID!,
          "X-Environment": process.env.NEXT_PUBLIC_BKEND_ENVIRONMENT!,
          "X-API-Key": process.env.BKEND_API_KEY!,
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ role }),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
