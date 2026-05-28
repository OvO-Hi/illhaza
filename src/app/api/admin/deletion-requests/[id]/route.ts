import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CommentStatus,
  DeletionStatus,
  DeletionTargetType,
  ReviewStatus,
} from "@prisma/client";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const decisionSchema = z.object({
  decision: z.enum(["APPROVED", "REJECTED"]),
  adminNote: z.string().max(1000).optional(),
});

type DecisionOutcome =
  | { ok: true }
  | { error: "NOT_FOUND" | "ALREADY_DECIDED" };

export async function PATCH(
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
  const parsed = decisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "잘못된 요청" }, { status: 400 });
  }

  const result = await prisma.$transaction<DecisionOutcome>(async (tx) => {
    const request = await tx.deletionRequest.findUnique({
      where: { id },
      select: {
        id: true,
        status: true,
        targetType: true,
        reviewId: true,
        commentId: true,
      },
    });
    if (!request) return { error: "NOT_FOUND" };
    if (request.status !== DeletionStatus.PENDING) {
      return { error: "ALREADY_DECIDED" };
    }

    if (parsed.data.decision === "APPROVED") {
      if (
        request.targetType === DeletionTargetType.REVIEW &&
        request.reviewId
      ) {
        await tx.review.update({
          where: { id: request.reviewId },
          data: { status: ReviewStatus.DELETED },
        });
      } else if (
        request.targetType === DeletionTargetType.COMMENT &&
        request.commentId
      ) {
        await tx.comment.update({
          where: { id: request.commentId },
          data: { status: CommentStatus.DELETED },
        });
      }
    } else {
      // 반려 → PUBLISHED 복귀
      if (
        request.targetType === DeletionTargetType.REVIEW &&
        request.reviewId
      ) {
        await tx.review.update({
          where: { id: request.reviewId },
          data: { status: ReviewStatus.PUBLISHED },
        });
      } else if (
        request.targetType === DeletionTargetType.COMMENT &&
        request.commentId
      ) {
        await tx.comment.update({
          where: { id: request.commentId },
          data: { status: CommentStatus.PUBLISHED },
        });
      }
    }

    await tx.deletionRequest.update({
      where: { id },
      data: {
        status:
          parsed.data.decision === "APPROVED"
            ? DeletionStatus.APPROVED
            : DeletionStatus.REJECTED,
        reviewedById: admin.id,
        reviewedAt: new Date(),
        adminNote: parsed.data.adminNote ?? null,
      },
    });

    return { ok: true };
  });

  if ("error" in result) {
    const errorMap = {
      NOT_FOUND: { msg: "요청을 찾을 수 없습니다", status: 404 },
      ALREADY_DECIDED: { msg: "이미 처리된 요청입니다", status: 400 },
    } as const;
    const { msg, status } = errorMap[result.error];
    return NextResponse.json({ error: msg }, { status });
  }

  return NextResponse.json({ ok: true });
}
