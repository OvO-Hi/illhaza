import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkplaceDevClient, type ListedWorkplace } from "./client";

export default async function WorkplaceDevPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const workplaces = await prisma.workplace.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      _count: { select: { reviews: { where: { status: "PUBLISHED" } } } },
    },
  });

  // Prisma Decimal/Date 등은 클라이언트에 직렬화 가능하게 일반 형태로 변환
  const initialList: ListedWorkplace[] = workplaces.map((w) => ({
    id: w.id,
    name: w.name,
    address: w.address,
    district: w.district,
    latitude: w.latitude,
    longitude: w.longitude,
    category: w.category,
    transitMinFromMainGate: w.transitMinFromMainGate,
    transitMinFromBackGate: w.transitMinFromBackGate,
    _count: w._count,
  }));

  return <WorkplaceDevClient initialList={initialList} />;
}
