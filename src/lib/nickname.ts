import { prisma } from "./prisma";

/**
 * 후기 작성/댓글 작성 시 호출.
 * 해당 review에 user가 이미 참여한 적 있으면 기존 닉네임 반환.
 * 처음이면 "익명N" 새로 부여 (N은 해당 review의 다음 순번).
 */
export async function getOrCreateReviewNickname(
  reviewId: string,
  userId: string,
): Promise<string> {
  const existing = await prisma.reviewParticipant.findUnique({
    where: { reviewId_userId: { reviewId, userId } },
  });
  if (existing) return existing.nickname;

  const count = await prisma.reviewParticipant.count({ where: { reviewId } });
  const nickname = `익명${count + 1}`;

  await prisma.reviewParticipant.create({
    data: { reviewId, userId, nickname },
  });

  return nickname;
}

/**
 * 표시용 닉네임 — 탈퇴 회원이면 override.
 */
export function displayNickname(
  nickname: string,
  userStatus: "ACTIVE" | "DELETED",
): string {
  return userStatus === "DELETED" ? "(탈퇴한 회원)" : nickname;
}
