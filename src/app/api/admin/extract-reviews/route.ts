import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { extractReviewsFromImage } from "@/lib/claude";

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

const MAX_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const formData = await req.formData().catch(() => null);
  if (!formData) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const file = formData.get("image");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "이미지를 업로드해주세요" },
      { status: 400 },
    );
  }

  if (!ALLOWED_TYPES.includes(file.type as AllowedType)) {
    return NextResponse.json(
      { error: "JPEG/PNG/WebP 이미지만 지원합니다" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: "10MB 이하 이미지만 업로드 가능합니다" },
      { status: 400 },
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");

  try {
    const reviews = await extractReviewsFromImage(
      base64,
      file.type as AllowedType,
    );
    return NextResponse.json({ reviews });
  } catch (e) {
    console.error("OCR error:", e);
    return NextResponse.json(
      {
        error: `이미지 분석 실패: ${e instanceof Error ? e.message : "unknown"}`,
      },
      { status: 500 },
    );
  }
}
