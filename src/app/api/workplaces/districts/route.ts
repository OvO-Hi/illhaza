import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type CityGroup = { city: string; districts: string[] };

export async function GET() {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const rows = await prisma.workplace.findMany({
    select: { city: true, district: true },
    distinct: ["city", "district"],
    orderBy: [{ city: "asc" }, { district: "asc" }],
  });

  const grouped = new Map<string, string[]>();
  for (const row of rows) {
    const list = grouped.get(row.city);
    if (list) {
      list.push(row.district);
    } else {
      grouped.set(row.city, [row.district]);
    }
  }

  const cities: CityGroup[] = Array.from(grouped.entries()).map(
    ([city, districts]) => ({ city, districts }),
  );

  return NextResponse.json({ cities });
}
