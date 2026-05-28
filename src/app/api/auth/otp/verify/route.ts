import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { validateEwhaEmail } from "@/lib/email";
import {
  hashEmail,
  encryptEmail,
  hashOtp,
  generateDeviceToken,
  hashDeviceToken,
} from "@/lib/crypto";
import {
  setSessionCookie,
  setDeviceCookie,
  DEVICE_DURATION_MS,
} from "@/lib/session";

const schema = z.object({
  email: z.string().email(),
  code: z.string().regex(/^\d{6}$/),
  trustDevice: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const validation = validateEwhaEmail(parsed.data.email);
  if (!validation.valid || !validation.domain) {
    return NextResponse.json(
      { error: validation.error ?? "잘못된 이메일" },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLowerCase().trim();
  const emailHash = hashEmail(email);
  const codeHash = hashOtp(parsed.data.code);

  // 가장 최근 미사용 OTP
  const otp = await prisma.otpCode.findFirst({
    where: {
      emailHash,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    return NextResponse.json(
      { error: "코드가 만료되었거나 존재하지 않습니다" },
      { status: 400 },
    );
  }

  if (otp.attemptsRemaining <= 0) {
    return NextResponse.json(
      { error: "시도 횟수를 초과했습니다. 새 코드를 요청해주세요" },
      { status: 400 },
    );
  }

  if (otp.codeHash !== codeHash) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attemptsRemaining: { decrement: 1 } },
    });
    return NextResponse.json(
      {
        error: `코드가 일치하지 않습니다 (남은 시도: ${otp.attemptsRemaining - 1}회)`,
      },
      { status: 400 },
    );
  }

  // OTP 검증 성공 → consume
  await prisma.otpCode.update({
    where: { id: otp.id },
    data: { consumedAt: new Date() },
  });

  // User upsert (신규/기존 자동 처리)
  let user = await prisma.user.findUnique({
    where: { emailHash },
    select: { id: true, role: true, status: true },
  });

  if (user?.status === "DELETED") {
    return NextResponse.json({ error: "탈퇴한 계정입니다" }, { status: 403 });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        emailHash,
        emailEncrypted: encryptEmail(email),
        emailDomain: validation.domain,
      },
      select: { id: true, role: true, status: true },
    });
  }

  const emailLocal = email.split("@")[0] ?? "";
  await setSessionCookie({ userId: user.id, role: user.role, emailLocal });

  // 신뢰 기기 처리
  if (parsed.data.trustDevice) {
    const deviceToken = generateDeviceToken();
    const tokenHash = hashDeviceToken(deviceToken);
    const userAgent = req.headers.get("user-agent") ?? null;

    await prisma.device.create({
      data: {
        userId: user.id,
        deviceTokenHash: tokenHash,
        userAgent,
        expiresAt: new Date(Date.now() + DEVICE_DURATION_MS),
      },
    });

    await setDeviceCookie(deviceToken);
  }

  return NextResponse.json({ ok: true, role: user.role });
}
