import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
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
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const adminReviewSchema = z.object({
  workplaceId: z.string().min(1),
  workPeriodType: z.nativeEnum(WorkPeriodType).nullable().optional(),
  workYear: z
    .number()
    .int()
    .min(2015)
    .max(new Date().getFullYear())
    .nullable()
    .optional(),
  workYearPublic: z.boolean().default(true),
  workTerm: z.nativeEnum(WorkTerm).nullable().optional(),
  workTermPublic: z.boolean().default(true),
  workDuration: z.nativeEnum(WorkDuration).nullable().optional(),
  incomeBracket: z.nativeEnum(IncomeBracket).nullable().optional(),
  incomeBracketPublic: z.boolean().default(true),
  tasks: z.array(z.nativeEnum(TaskType)).default([]),
  tasksOtherText: z.string().trim().max(500).nullable().optional(),
  autonomyScore: z.number().int().min(1).max(5).nullable().optional(),
  studyPossibility: z.nativeEnum(StudyPossibility).nullable().optional(),
  workEnvironment: z.nativeEnum(WorkEnvironment).nullable().optional(),
  coworkerTypes: z.array(z.nativeEnum(CoworkerType)).default([]),
  recommendedFor: z.array(z.nativeEnum(RecommendTag)).default([]),
  overallRating: z.number().int().min(1).max(5).nullable().optional(),
  freeText: z
    .string()
    .max(5000)
    .refine((s) => s.trim().length >= 5, {
      message: "자유 작성은 5자 이상 입력해주세요",
    }),
}).superRefine((data, ctx) => {
  if (data.tasks.includes(TaskType.OTHER)) {
    const t = data.tasksOtherText;
    if (!t || t.trim().length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["tasksOtherText"],
        message: '"기타" 선택 시 5자 이상 입력해주세요',
      });
    }
  }
});

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminReviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "입력값 검증 실패", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const workplace = await prisma.workplace.findUnique({
    where: { id: parsed.data.workplaceId },
    select: { id: true },
  });
  if (!workplace) {
    return NextResponse.json(
      { error: "존재하지 않는 근로지" },
      { status: 400 },
    );
  }

  const data = parsed.data;
  const tasksOther = data.tasksOtherText?.trim();

  const review = await prisma.$transaction(async (tx) => {
    const created = await tx.review.create({
      data: {
        workplaceId: data.workplaceId,
        authorId: admin.id,
        isAdminEntry: true,
        workPeriodType: data.workPeriodType ?? null,
        workYear: data.workYear ?? null,
        workYearPublic: data.workYearPublic,
        workTerm: data.workTerm ?? null,
        workTermPublic: data.workTermPublic,
        workDuration: data.workDuration ?? null,
        incomeBracket: data.incomeBracket ?? null,
        incomeBracketPublic: data.incomeBracketPublic,
        tasks: data.tasks,
        tasksOtherText:
          tasksOther && tasksOther.length > 0 ? tasksOther : null,
        autonomyScore: data.autonomyScore ?? null,
        studyPossibility: data.studyPossibility ?? null,
        workEnvironment: data.workEnvironment ?? null,
        coworkerTypes: data.coworkerTypes,
        recommendedFor: data.recommendedFor,
        overallRating: data.overallRating ?? null,
        freeText: data.freeText,
        status: ReviewStatus.PUBLISHED,
      },
    });

    // 일반 흐름과 동일하게 어드민도 익명1로 ReviewParticipant 등록
    await tx.reviewParticipant.create({
      data: {
        reviewId: created.id,
        userId: admin.id,
        nickname: "익명1",
      },
    });

    return created;
  });

  return NextResponse.json({ review }, { status: 201 });
}
