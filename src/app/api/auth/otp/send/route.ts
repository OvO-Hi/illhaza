import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateEwhaEmail } from "@/lib/email";
import { hashEmail, generateOtp, hashOtp } from "@/lib/crypto";
import { sendOtpEmail } from "@/lib/mailer";

const schema = z.object({ email: z.string().email() });
const RESEND_COOLDOWN_MS = 60 * 1000; // 1분
const OTP_EXPIRY_MS = 5 * 60 * 1000; // 5분

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "이메일 형식이 올바르지 않습니다" },
      { status: 400 },
    );
  }

  const validation = validateEwhaEmail(parsed.data.email);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailHash = hashEmail(email);

  // 탈퇴 회원 차단
  const user = await prisma.user.findUnique({
    where: { emailHash },
    select: { status: true },
  });
  if (user?.status === "DELETED") {
    return NextResponse.json(
      { error: "이 이메일은 더 이상 사용할 수 없습니다" },
      { status: 403 },
    );
  }

  // Rate limit: 1분 이내 유효한 미사용 OTP 있으면 거부
  const recentOtp = await prisma.otpCode.findFirst({
    where: {
      emailHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
      createdAt: { gt: new Date(Date.now() - RESEND_COOLDOWN_MS) },
    },
    orderBy: { createdAt: "desc" },
  });
  if (recentOtp) {
    const remainSec = Math.ceil(
      (recentOtp.createdAt.getTime() + RESEND_COOLDOWN_MS - Date.now()) / 1000,
    );
    return NextResponse.json(
      { error: `${remainSec}초 후 다시 시도해주세요` },
      { status: 429 },
    );
  }

  const code = generateOtp();
  await prisma.otpCode.create({
    data: {
      emailHash,
      codeHash: hashOtp(code),
      expiresAt: new Date(Date.now() + OTP_EXPIRY_MS),
    },
  });

  try {
    await sendOtpEmail(email, code);
  } catch (e) {
    console.error("Resend error:", e);
    return NextResponse.json({ error: "이메일 발송 실패" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
