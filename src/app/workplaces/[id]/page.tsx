import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  WorkplaceDetailClient,
  type ReviewCardItem,
} from "./detail-client";

export default async function WorkplaceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const workplace = await prisma.workplace.findUnique({
    where: { id },
    include: {
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { comments: { where: { status: "PUBLISHED" } } },
          },
        },
      },
    },
  });

  if (!workplace) notFound();

  const ratings = workplace.reviews
    .map((r) => r.overallRating)
    .filter((r): r is number => r !== null);
  const avgRating =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : null;

  const isAdmin = user.role === "ADMIN";
  const reviewCards: ReviewCardItem[] = workplace.reviews.map((r) => {
    const isOwner = r.authorId === user.id;
    const canSeeYear = r.workYearPublic || isAdmin || isOwner;
    const canSeeTerm = r.workTermPublic || isAdmin || isOwner;
    const isEdited =
      r.updatedAt.getTime() - r.createdAt.getTime() > 60 * 1000;
    return {
      id: r.id,
      workPeriodType: r.workPeriodType,
      workYear: canSeeYear ? r.workYear : null,
      workTerm: canSeeTerm ? r.workTerm : null,
      incomeBracket:
        !isAdmin && !isOwner && !r.incomeBracketPublic
          ? null
          : r.incomeBracket,
      autonomyScore: r.autonomyScore,
      overallRating: r.overallRating,
      commentCount: r._count.comments,
      excerpt: r.freeText?.slice(0, 80) ?? "",
      isEdited,
    };
  });

  return (
    <WorkplaceDetailClient
      workplace={{
        id: workplace.id,
        name: workplace.name,
        department: workplace.department,
        address: workplace.address,
        district: workplace.district,
        category: workplace.category,
        latitude: workplace.latitude,
        longitude: workplace.longitude,
        transitMinFromMainGate: workplace.transitMinFromMainGate,
        transitMinFromBackGate: workplace.transitMinFromBackGate,
      }}
      reviews={reviewCards}
      avgRating={avgRating}
      isAdmin={isAdmin}
    />
  );
}
