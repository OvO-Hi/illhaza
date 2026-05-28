import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewFormClient } from "./form-client";

export default async function NewReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ workplaceId?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { workplaceId } = await searchParams;
  let initialWorkplace: { id: string; name: string } | null = null;

  if (workplaceId) {
    const wp = await prisma.workplace.findUnique({
      where: { id: workplaceId },
      select: { id: true, name: true, department: true },
    });
    if (wp) {
      initialWorkplace = {
        id: wp.id,
        name: wp.department ? `${wp.name} — ${wp.department}` : wp.name,
      };
    }
  }

  return <ReviewFormClient initialWorkplace={initialWorkplace} />;
}
