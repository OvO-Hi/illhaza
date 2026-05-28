import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  AdminDashboard,
  type DeletionRequestItem,
} from "./dashboard";

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect("/");

  const rows = await prisma.deletionRequest.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: {
      review: {
        select: {
          id: true,
          freeText: true,
          createdAt: true,
          workplace: { select: { name: true, department: true } },
        },
      },
      comment: {
        select: {
          id: true,
          content: true,
          createdAt: true,
          reviewId: true,
        },
      },
    },
  });

  const initialRequests: DeletionRequestItem[] = rows.map((r) => ({
    id: r.id,
    targetType: r.targetType,
    reason: r.reason,
    createdAt: r.createdAt.toISOString(),
    review: r.review
      ? {
          id: r.review.id,
          excerpt: r.review.freeText?.slice(0, 200) ?? "",
          workplaceName: r.review.workplace.department
            ? `${r.review.workplace.name} — ${r.review.workplace.department}`
            : r.review.workplace.name,
          createdAt: r.review.createdAt.toISOString(),
        }
      : null,
    comment: r.comment
      ? {
          id: r.comment.id,
          content: r.comment.content,
          reviewId: r.comment.reviewId,
          createdAt: r.comment.createdAt.toISOString(),
        }
      : null,
  }));

  return <AdminDashboard initialRequests={initialRequests} />;
}
