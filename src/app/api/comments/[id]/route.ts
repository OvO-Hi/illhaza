import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { CommentStatus } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  content: z.string().trim().min(1).max(2000),
});

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
    return NextResponse.json({ error: "내용을 입력해주세요" }, { status: 400 });
  }

  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, status: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (comment.authorId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (comment.status !== "PUBLISHED") {
    return NextResponse.json(
      { error: "수정할 수 없는 상태입니다" },
      { status: 400 },
    );
  }

  const updated = await prisma.comment.update({
    where: { id },
    data: { content: parsed.data.content },
  });

  return NextResponse.json({
    comment: {
      id: updated.id,
      content: updated.content,
      updatedAt: updated.updatedAt.toISOString(),
    },
  });
}

// 댓글은 작성자가 즉시 soft delete. 후기와 달리 사유·승인 절차 없음.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const comment = await prisma.comment.findUnique({
    where: { id },
    select: { authorId: true, status: true },
  });
  if (!comment) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (comment.authorId !== user.id) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (comment.status !== CommentStatus.PUBLISHED) {
    return NextResponse.json(
      { error: "삭제할 수 없는 상태입니다" },
      { status: 400 },
    );
  }

  await prisma.comment.update({
    where: { id },
    data: { status: CommentStatus.DELETED },
  });

  return NextResponse.json({ ok: true });
}
