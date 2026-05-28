import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { EditClient, type EditingReview } from "./edit-client";

export const metadata = {
  title: "후기 수정",
};

export default async function EditReviewPage({
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
        select: { id: true, name: true, department: true },
      },
    },
  });

  if (!review) notFound();
  if (review.authorId !== user.id) redirect(`/reviews/${id}`);
  if (review.status !== "PUBLISHED") redirect(`/reviews/${id}`);

  const editingReview: EditingReview = {
    id: review.id,
    workplaceId: review.workplaceId,
    workplaceName: review.workplace.department
      ? `${review.workplace.name} — ${review.workplace.department}`
      : review.workplace.name,
    workPeriodType: review.workPeriodType,
    workYear: review.workYear,
    workYearPublic: review.workYearPublic,
    workTerm: review.workTerm,
    workTermPublic: review.workTermPublic,
    workDuration: review.workDuration,
    incomeBracket: review.incomeBracket,
    incomeBracketPublic: review.incomeBracketPublic,
    tasks: review.tasks,
    tasksOtherText: review.tasksOtherText ?? "",
    autonomyScore: review.autonomyScore,
    studyPossibility: review.studyPossibility,
    workEnvironment: review.workEnvironment,
    coworkerTypes: review.coworkerTypes,
    recommendedFor: review.recommendedFor,
    overallRating: review.overallRating,
    freeText: review.freeText ?? "",
  };

  return <EditClient review={editingReview} />;
}
