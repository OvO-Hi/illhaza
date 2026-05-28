import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  HomeClient,
  type WorkplaceListItem,
  type CityGroup,
} from "./home-client";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [workplaces, cityDistrictRows] = await Promise.all([
    prisma.workplace.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        _count: {
          select: { reviews: { where: { status: "PUBLISHED" } } },
        },
        reviews: {
          where: { status: "PUBLISHED" },
          select: { overallRating: true },
        },
      },
    }),
    prisma.workplace.findMany({
      select: { city: true, district: true },
      distinct: ["city", "district"],
      orderBy: [{ city: "asc" }, { district: "asc" }],
    }),
  ]);

  const initialWorkplaces: WorkplaceListItem[] = workplaces.map((wp) => {
    const ratings = wp.reviews
      .map((r) => r.overallRating)
      .filter((r): r is number => r !== null);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;
    return {
      id: wp.id,
      name: wp.name,
      department: wp.department,
      district: wp.district,
      category: wp.category,
      transitMinFromMainGate: wp.transitMinFromMainGate,
      transitMinFromBackGate: wp.transitMinFromBackGate,
      reviewCount: wp._count.reviews,
      avgRating,
    };
  });

  const groupedMap = new Map<string, string[]>();
  for (const row of cityDistrictRows) {
    const list = groupedMap.get(row.city);
    if (list) list.push(row.district);
    else groupedMap.set(row.city, [row.district]);
  }
  const initialCityGroups: CityGroup[] = Array.from(groupedMap.entries()).map(
    ([city, districts]) => ({ city, districts }),
  );

  return (
    <HomeClient
      initialWorkplaces={initialWorkplaces}
      initialCityGroups={initialCityGroups}
      userRole={user.role}
    />
  );
}
