import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  DeletionStatus,
  DeletionTargetType,
  ReviewStatus,
} from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// 후기만 어드민 승인제. 댓글은 작성자가 직접 DELETE /api/comments/[id]로 즉시 삭제.
const createSchema = z.object({
  targetType: z.literal("REVIEW"),
  targetId: z.string().min(1),
  reason: z
    .string()
    .trim()
    .min(5, "삭제 사유를 5자 이상 작성해주세요")
    .max(1000),
});

type CreateOutcome =
  | { ok: true }
  | {
      error:
        | "NOT_FOUND"
        | "FORBIDDEN"
        | "INVALID_STATE"
        | "ALREADY_REQUESTED";
    };

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 검증 실패" },
      { status: 400 },
    );
  }
  const { targetId, reason } = parsed.data;

  const result = await prisma.$transaction<CreateOutcome>(async (tx) => {
    const review = await tx.review.findUnique({
      where: { id: targetId },
      select: { id: true, authorId: true, status: true },
    });
    if (!review) return { error: "NOT_FOUND" };
    if (review.authorId !== user.id) return { error: "FORBIDDEN" };
    if (review.status !== ReviewStatus.PUBLISHED) {
      return { error: "INVALID_STATE" };
    }

    const existing = await tx.deletionRequest.findFirst({
      where: { reviewId: targetId, status: DeletionStatus.PENDING },
    });
    if (existing) return { error: "ALREADY_REQUESTED" };

    await tx.review.update({
      where: { id: targetId },
      data: { status: ReviewStatus.PENDING_DELETION },
    });

    await tx.deletionRequest.create({
      data: {
        targetType: DeletionTargetType.REVIEW,
        reviewId: targetId,
        requesterId: user.id,
        reason,
      },
    });
    return { ok: true };
  });

  if ("error" in result) {
    const errorMap = {
      NOT_FOUND: { msg: "대상을 찾을 수 없습니다", status: 404 },
      FORBIDDEN: {
        msg: "본인 글만 삭제 요청할 수 있습니다",
        status: 403,
      },
      INVALID_STATE: {
        msg: "이미 처리 중이거나 삭제된 글입니다",
        status: 400,
      },
      ALREADY_REQUESTED: {
        msg: "이미 삭제 요청이 진행 중입니다",
        status: 400,
      },
    } as const;
    const { msg, status } = errorMap[result.error];
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
