import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DeletionStatus,
  DeletionTargetType,
  ReviewStatus,
} from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminDeleteSchema = z.object({
  reason: z.string().trim().min(5, "삭제 사유를 5자 이상 작성해주세요").max(1000),
});

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = adminDeleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "잘못된 요청" },
      { status: 400 },
    );
  }

  const review = await prisma.review.findUnique({
    where: { id },
    select: { id: true, status: true },
  });
  if (!review) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (review.status === ReviewStatus.DELETED) {
    return NextResponse.json(
      { error: "이미 삭제된 후기입니다" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.review.update({
      where: { id },
      data: { status: ReviewStatus.DELETED },
    });

    // 진행 중인 PENDING 사용자 요청이 있으면 같이 APPROVED 처리
    const pendingUpdated = await tx.deletionRequest.updateMany({
      where: { reviewId: id, status: DeletionStatus.PENDING },
      data: {
        status: DeletionStatus.APPROVED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        adminNote: parsed.data.reason,
      },
    });

    // PENDING이 하나도 없었으면 어드민 직접 삭제 흔적으로 새 row 생성
    if (pendingUpdated.count === 0) {
      await tx.deletionRequest.create({
        data: {
          targetType: DeletionTargetType.REVIEW,
          reviewId: id,
          requesterId: admin.id,
          reason: `[어드민 직접 삭제] ${parsed.data.reason}`,
          status: DeletionStatus.APPROVED,
          reviewedById: admin.id,
          reviewedAt: new Date(),
          adminNote: parsed.data.reason,
        },
      });
    }
  });

  return NextResponse.json({ ok: true });
}
