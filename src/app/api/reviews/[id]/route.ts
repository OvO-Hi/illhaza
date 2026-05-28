import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  CoworkerType,
  IncomeBracket,
  RecommendTag,
  ReviewStatus,
  StudyPossibility,
  TaskType,
  WorkDuration,
  WorkEnvironment,
  WorkPeriodType,
  WorkTerm,
} from "@prisma/client";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayNickname } from "@/lib/nickname";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      workplace: {
        select: { id: true, name: true, district: true, category: true },
      },
      author: { select: { id: true, status: true } },
      participants: { select: { userId: true, nickname: true } },
    },
  });

  if (!review) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = currentUser.role === "ADMIN";
  const isAuthor = review.authorId === currentUser.id;

  if (!isAdmin) {
    if (review.status === "DELETED") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    if (review.status === "PENDING_DELETION" && !isAuthor) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
  }

  // 분위 마스킹
  const sanitized =
    !isAdmin && !review.incomeBracketPublic
      ? { ...review, incomeBracket: null }
      : review;

  const authorParticipant = review.participants.find(
    (p) => p.userId === review.authorId,
  );
  const authorNickname = displayNickname(
    authorParticipant?.nickname ?? "익명",
    review.author.status,
  );

  return NextResponse.json({
    review: sanitized,
    authorNickname,
    isOwner: isAuthor,
  });
}

// ─── PATCH: 후기 수정 (작성자 본인만) ──────────────────────

const updateSchema = z
  .object({
    workPeriodType: z.nativeEnum(WorkPeriodType).nullable(),
    workYear: z
      .number()
      .int()
      .min(2015)
      .max(new Date().getFullYear())
      .nullable(),
    workYearPublic: z.boolean(),
    workTerm: z.nativeEnum(WorkTerm).nullable(),
    workTermPublic: z.boolean(),
    workDuration: z.nativeEnum(WorkDuration).nullable(),
    incomeBracket: z.nativeEnum(IncomeBracket).nullable(),
    incomeBracketPublic: z.boolean(),
    tasks: z.array(z.nativeEnum(TaskType)),
    tasksOtherText: z.string().trim().max(500).nullable(),
    autonomyScore: z.number().int().min(1).max(5).nullable(),
    studyPossibility: z.nativeEnum(StudyPossibility).nullable(),
    workEnvironment: z.nativeEnum(WorkEnvironment).nullable(),
    coworkerTypes: z.array(z.nativeEnum(CoworkerType)),
    recommendedFor: z.array(z.nativeEnum(RecommendTag)),
    overallRating: z.number().int().min(1).max(5).nullable(),
    freeText: z
      .string()
      .max(5000)
      .refine((s) => s.trim().length >= 5, {
        message: "자유 작성은 5자 이상 입력해주세요",
      }),
  })
  .refine(
    (d) =>
      !d.tasks.includes(TaskType.OTHER) ||
      (d.tasksOtherText?.trim().length ?? 0) >= 5,
    {
      message: "기타 업무 항목은 5자 이상 작성해주세요",
      path: ["tasksOtherText"],
    },
  );

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 검증 실패" },
      { status: 400 },
    );
  }

  const review = await prisma.review.findUnique({
    where: { id },
    select: { authorId: true, status: true },
  });
  if (!review) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (review.authorId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (review.status !== ReviewStatus.PUBLISHED) {
    return NextResponse.json(
      { error: "수정할 수 없는 상태입니다" },
      { status: 400 },
    );
  }

  const otherTrimmed = parsed.data.tasksOtherText?.trim();

  await prisma.review.update({
    where: { id },
    data: {
      ...parsed.data,
      tasksOtherText:
        otherTrimmed && otherTrimmed.length > 0 ? otherTrimmed : null,
      // updatedAt은 Prisma @updatedAt이 자동 갱신
    },
  });

  return NextResponse.json({ ok: true });
}
