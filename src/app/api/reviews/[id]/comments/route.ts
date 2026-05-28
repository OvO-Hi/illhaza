import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CommentStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayNickname } from "@/lib/nickname";

const createCommentSchema = z.object({
  content: z.string().trim().min(1, "내용을 입력해주세요").max(2000),
});

// ─── POST: 댓글 작성 (닉네임 부여 트랜잭션) ──────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: reviewId } = await params;

  const body = await req.json().catch(() => null);
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 검증 실패" },
      { status: 400 },
    );
  }

  // PUBLISHED 후기에만 댓글 허용 (어드민도 PENDING_DELETION엔 작성 X)
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, status: true },
  });
  if (!review) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (review.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "댓글을 작성할 수 없는 상태입니다" },
      { status: 400 },
    );
  }

  // 닉네임 부여(없으면 익명N 신규)와 댓글 생성을 같은 트랜잭션 안에서.
  // lib/nickname의 함수는 자체 prisma 인스턴스를 쓰므로 여기선 인라인.
  const result = await prisma.$transaction(async (tx) => {
    let participant = await tx.reviewParticipant.findUnique({
      where: { reviewId_userId: { reviewId, userId: user.id } },
    });
    if (!participant) {
      const count = await tx.reviewParticipant.count({ where: { reviewId } });
      participant = await tx.reviewParticipant.create({
        data: {
          reviewId,
          userId: user.id,
          nickname: `익명${count + 1}`,
        },
      });
    }

    const comment = await tx.comment.create({
      data: {
        reviewId,
        authorId: user.id,
        content: parsed.data.content,
        status: CommentStatus.PUBLISHED,
      },
    });

    return { comment, nickname: participant.nickname };
  });

  return NextResponse.json(
    {
      comment: {
        id: result.comment.id,
        content: result.comment.content,
        createdAt: result.comment.createdAt.toISOString(),
        updatedAt: result.comment.updatedAt.toISOString(),
        status: result.comment.status,
        authorNickname: result.nickname,
        isOwner: true,
      },
    },
    { status: 201 },
  );
}

// ─── GET: 댓글 목록 ──────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: reviewId } = await params;

  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { id: true, status: true },
  });
  if (!review) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const isAdmin = user.role === "ADMIN";
  if (!isAdmin && review.status !== "PUBLISHED") {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // 일반 사용자: PUBLISHED만. 어드민: 전체 (DELETED 포함)
  const commentWhere = isAdmin
    ? { reviewId }
    : { reviewId, status: CommentStatus.PUBLISHED };

  const [comments, participants] = await Promise.all([
    prisma.comment.findMany({
      where: commentWhere,
      orderBy: { createdAt: "asc" },
      include: {
        author: { select: { id: true, status: true } },
      },
    }),
    prisma.reviewParticipant.findMany({
      where: { reviewId },
      select: { userId: true, nickname: true },
    }),
  ]);

  const nicknameByUserId = new Map(
    participants.map((p) => [p.userId, p.nickname]),
  );

  const result = comments.map((c) => ({
    id: c.id,
    content: c.content,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
    status: c.status,
    authorNickname: displayNickname(
      nicknameByUserId.get(c.authorId) ?? "익명",
      c.author.status,
    ),
    isOwner: c.authorId === user.id,
  }));

  return NextResponse.json({ comments: result });
}
