import { NextRequest, NextResponse } from "next/server";

const HF_OCR_URL = process.env.HF_OCR_URL || "https://pappoi-corp-card-use.hf.space/extract";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const password = formData.get("password") as string;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    // HF Space FastAPI로 PDF 전달
    const hfForm = new FormData();
    hfForm.append("file", file);
    hfForm.append("password", password || "");

    const response = await fetch(HF_OCR_URL, {
      method: "POST",
      body: hfForm,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("HF Space error:", text);
      return NextResponse.json({ success: false, error: "OCR service error" }, { status: 500 });
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error: any) {
    console.error("API Route Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
