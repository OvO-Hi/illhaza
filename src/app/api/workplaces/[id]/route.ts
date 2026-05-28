import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser();
  if (!currentUser) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = currentUser.role === "ADMIN";

  const workplace = await prisma.workplace.findUnique({
    where: { id },
    include: {
      reviews: {
        where: isAdmin
          ? undefined
          : {
              OR: [
                { status: "PUBLISHED" },
                {
                  AND: [
                    { status: "PENDING_DELETION" },
                    { authorId: currentUser.id },
                  ],
                },
              ],
            },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { comments: { where: { status: "PUBLISHED" } } },
          },
        },
      },
    },
  });

  if (!workplace) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const ratings = workplace.reviews
    .map((r) => r.overallRating)
    .filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  // 분위 마스킹: 일반 사용자가 incomeBracketPublic=false인 후기 보면 incomeBracket=null
  const sanitizedReviews = workplace.reviews.map((r) => ({
    ...r,
    incomeBracket:
      !isAdmin && !r.incomeBracketPublic ? null : r.incomeBracket,
  }));

  return NextResponse.json({
    workplace: { ...workplace, reviews: sanitizedReviews },
    avgRating,
  });
}
