import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  WorkPeriodType,
  WorkTerm,
  WorkDuration,
  IncomeBracket,
  TaskType,
  StudyPossibility,
  WorkEnvironment,
  CoworkerType,
  RecommendTag,
  ReviewStatus,
} from "@prisma/client";

const userReviewSchema = z
  .object({
    workplaceId: z.string().min(1),
    workPeriodType: z.nativeEnum(WorkPeriodType),
    workYear: z.number().int().min(2015).max(new Date().getFullYear()),
    workYearPublic: z.boolean().default(true),
    workTerm: z.nativeEnum(WorkTerm),
    workTermPublic: z.boolean().default(true),
    workDuration: z.nativeEnum(WorkDuration),
    incomeBracket: z.nativeEnum(IncomeBracket),
    incomeBracketPublic: z.boolean(),
    tasks: z
      .array(z.nativeEnum(TaskType))
      .min(1, "업무를 1개 이상 선택해주세요"),
    tasksOtherText: z.string().max(500).default(""),
    autonomyScore: z.number().int().min(1).max(5),
    studyPossibility: z.nativeEnum(StudyPossibility),
    workEnvironment: z.nativeEnum(WorkEnvironment),
    coworkerTypes: z
      .array(z.nativeEnum(CoworkerType))
      .min(1, "함께 일하는 사람을 선택해주세요"),
    recommendedFor: z.array(z.nativeEnum(RecommendTag)),
    overallRating: z.number().int().min(1).max(5),
    freeText: z
      .string()
      .max(5000)
      .refine((s) => s.trim().length >= 5, {
        message: "자유 작성은 5자 이상 입력해주세요",
      }),
  })
  .refine(
    (data) =>
      !data.tasks.includes(TaskType.OTHER) ||
      data.tasksOtherText.trim().length >= 5,
    {
      message: "기타 업무 선택 시 5자 이상 설명해주세요",
      path: ["tasksOtherText"],
    },
  );

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = userReviewSchema.safeParse(body);
  if (!parsed.success) {
    console.error(
      "[POST /api/reviews] validation failed:",
      JSON.stringify(parsed.error.issues, null, 2),
    );
    console.error(
      "[POST /api/reviews] received body:",
      JSON.stringify(body, null, 2),
    );
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "입력값 검증 실패",
        issues: parsed.error.issues,
      },
      { status: 400 },
    );
  }

  const workplace = await prisma.workplace.findUnique({
    where: { id: parsed.data.workplaceId },
    select: { id: true },
  });
  if (!workplace) {
    return NextResponse.json(
      { error: "존재하지 않는 근로지입니다" },
      { status: 400 },
    );
  }

  const { tasksOtherText, ...rest } = parsed.data;
  const otherTextTrimmed = tasksOtherText.trim();

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        ...rest,
        tasksOtherText: otherTextTrimmed.length > 0 ? otherTextTrimmed : null,
        authorId: user.id,
        isAdminEntry: false,
        status: ReviewStatus.PUBLISHED,
      },
    });

    await tx.reviewParticipant.create({
      data: {
        reviewId: created.id,
        userId: user.id,
        nickname: "익명1",
      },
    });

    return created;
  });

  return NextResponse.json({ review }, { status: 201 });
}
