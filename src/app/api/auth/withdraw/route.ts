import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { UserStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { clearAuthCookies } from "@/lib/session";

const withdrawSchema = z.object({
  confirmText: z.literal("탈퇴합니다"),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = withdrawSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "확인 문구가 일치하지 않습니다" },
      { status: 400 },
    );
  }

  // 어드민은 탈퇴 차단 — 마지막 어드민 사라지면 운영 불가
  if (user.role === "ADMIN") {
    return NextResponse.json(
      { error: "어드민 계정은 탈퇴할 수 없습니다" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: user.id },
      data: { status: UserStatus.DELETED, deletedAt: new Date() },
    });
    // 모든 기기에서 자동 로그아웃되도록 Device 전체 삭제
    await tx.device.deleteMany({ where: { userId: user.id } });
  });

  await clearAuthCookies();

  return NextResponse.json({ ok: true });
}
