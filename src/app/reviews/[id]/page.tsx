import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { displayNickname } from "@/lib/nickname";
import {
  ReviewDetailClient,
  type ReviewDetailData,
} from "./detail-client";
import type { CommentItem } from "./comments-section";

export default async function ReviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const review = await prisma.review.findUnique({
    where: { id },
    include: {
      workplace: {
        select: { id: true, name: true, department: true, district: true },
      },
      author: { select: { id: true, status: true } },
      participants: { select: { userId: true, nickname: true } },
    },
  });

  if (!review) notFound();

  const isAdmin = user.role === "ADMIN";
  const isAuthor = review.authorId === user.id;

  if (!isAdmin) {
    if (review.status === "DELETED") notFound();
    if (review.status === "PENDING_DELETION" && !isAuthor) notFound();
  }

  const incomeBracket =
    !isAdmin && !review.incomeBracketPublic ? null : review.incomeBracket;

  const authorParticipant = review.participants.find(
    (p) => p.userId === review.authorId,
  );
  const authorNickname = displayNickname(
    authorParticipant?.nickname ?? "익명",
    review.author.status,
  );

  // 댓글 초기 SSR
  // 일반 사용자: PUBLISHED 후기에서만 댓글 조회. 어드민: 항상.
  const canLoadComments = isAdmin || review.status === "PUBLISHED";
  const canComment = review.status === "PUBLISHED";

  let initialComments: CommentItem[] = [];
  if (canLoadComments) {
    const comments = await prisma.comment.findMany({
      where: isAdmin
        ? { reviewId: id }
        : { reviewId: id, status: "PUBLISHED" },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, status: true } } },
    });

    const nicknameByUserId = new Map(
      review.participants.map((p) => [p.userId, p.nickname]),
    );

    initialComments = comments.map((c) => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      authorNickname: displayNickname(
        nicknameByUserId.get(c.authorId) ?? "익명",
        c.author.status,
      ),
      isOwner: c.authorId === user.id,
      status: c.status,
    }));
  }

  const data: ReviewDetailData = {
    id: review.id,
    workplace: review.workplace,
    workPeriodType: review.workPeriodType,
    workYear: review.workYear,
    workYearPublic: review.workYearPublic,
    workTerm: review.workTerm,
    workTermPublic: review.workTermPublic,
    workDuration: review.workDuration,
    incomeBracket,
    incomeBracketPublic: review.incomeBracketPublic,
    tasks: review.tasks,
    tasksOtherText: review.tasksOtherText,
    autonomyScore: review.autonomyScore,
    studyPossibility: review.studyPossibility,
    workEnvironment: review.workEnvironment,
    coworkerTypes: review.coworkerTypes,
    recommendedFor: review.recommendedFor,
    overallRating: review.overallRating,
    freeText: review.freeText,
    status: review.status,
    createdAt: review.createdAt.toISOString(),
    updatedAt: review.updatedAt.toISOString(),
  };

  return (
    <ReviewDetailClient
      review={data}
      authorNickname={authorNickname}
      isOwner={isAuthor}
      isAdmin={isAdmin}
      initialComments={initialComments}
      canComment={canComment}
    />
  );
}
