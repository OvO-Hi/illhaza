import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma, WorkplaceCategory } from "@prisma/client";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransitTimesFromEwha } from "@/lib/odsay";
import { geocodeAddress } from "@/lib/naver";

// ─── POST: 워크플레이스 생성 (external 또는 manual) ──────────────────────

const externalSchema = z.object({
  mode: z.literal("external"),
  externalPlaceId: z.string().min(1),
  externalData: z.object({
    placeName: z.string(),
    addressName: z.string(),
    roadAddressName: z.string().optional(),
    latitude: z.number(),
    longitude: z.number(),
    city: z.string(),
    district: z.string(),
  }),
  department: z.string().trim().min(1).max(100).optional(),
  category: z.nativeEnum(WorkplaceCategory),
});

const manualSchema = z.object({
  mode: z.literal("manual"),
  name: z.string().trim().min(1).max(200),
  department: z.string().trim().min(1).max(100).optional(),
  roadAddress: z.string().trim().min(5).max(300),
  city: z.string().trim().min(1).max(50),
  district: z.string().trim().min(1).max(50),
  category: z.nativeEnum(WorkplaceCategory),
});

const createSchema = z.discriminatedUnion("mode", [
  externalSchema,
  manualSchema,
]);

async function computeTransitForOffCampus(
  category: WorkplaceCategory,
  lat: number,
  lng: number,
): Promise<{ main: number | null; back: number | null }> {
  if (category === WorkplaceCategory.ON_CAMPUS) {
    return { main: null, back: null };
  }
  try {
    const times = await getTransitTimesFromEwha(lat, lng);
    return { main: times.fromMainGate, back: times.fromBackGate };
  } catch (e) {
    console.error("ODsay failed:", e);
    return { main: null, back: null };
  }
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  if (parsed.data.mode === "external") {
    return handleExternal(parsed.data, user.id);
  }
  return handleManual(parsed.data, user.id);
}

async function handleExternal(
  data: z.infer<typeof externalSchema>,
  userId: string,
) {
  const { externalPlaceId, externalData, department } = data;
  const departmentValue = department ?? null;

  // PG의 compound unique는 null 동등성 검사가 distinct이므로
  // findUnique 대신 findFirst로 사전 dedup
  const existing = await prisma.workplace.findFirst({
    where: { externalPlaceId, department: departmentValue },
  });
  if (existing) {
    return NextResponse.json({ workplace: existing, created: false });
  }

  const category = data.category;
  const { main, back } = await computeTransitForOffCampus(
    category,
    externalData.latitude,
    externalData.longitude,
  );

  const workplace = await prisma.workplace.create({
    data: {
      name: externalData.placeName,
      department: departmentValue,
      externalPlaceId,
      isManualEntry: false,
      address: externalData.roadAddressName || externalData.addressName,
      latitude: externalData.latitude,
      longitude: externalData.longitude,
      city: externalData.city,
      district: externalData.district,
      category,
      transitMinFromMainGate: main,
      transitMinFromBackGate: back,
      createdById: userId,
    },
  });

  return NextResponse.json({ workplace, created: true }, { status: 201 });
}

async function handleManual(
  data: z.infer<typeof manualSchema>,
  userId: string,
) {
  // Geocoding으로 도로명 주소 → 좌표
  let geocoded;
  try {
    geocoded = await geocodeAddress(data.roadAddress);
  } catch (e) {
    console.error("Geocoding error:", e);
    return NextResponse.json(
      { error: "주소 변환에 실패했습니다. 도로명 주소를 확인해주세요." },
      { status: 500 },
    );
  }
  if (!geocoded) {
    return NextResponse.json(
      { error: "도로명 주소로 위치를 찾을 수 없습니다" },
      { status: 400 },
    );
  }

  const category = data.category;
  const { main, back } = await computeTransitForOffCampus(
    category,
    geocoded.latitude,
    geocoded.longitude,
  );

  const workplace = await prisma.workplace.create({
    data: {
      name: data.name,
      department: data.department ?? null,
      externalPlaceId: null,
      isManualEntry: true,
      address: geocoded.matchedAddress,
      latitude: geocoded.latitude,
      longitude: geocoded.longitude,
      city: data.city,
      district: data.district,
      category,
      transitMinFromMainGate: main,
      transitMinFromBackGate: back,
      createdById: userId,
    },
  });

  return NextResponse.json({ workplace, created: true }, { status: 201 });
}

// ─── GET: 목록 조회 (검색·필터·정렬) ──────────────────────

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim() ?? "";
  const citiesParam = url.searchParams.get("city") ?? "";
  const cities = citiesParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const districtsParam = url.searchParams.get("district") ?? "";
  const districts = districtsParam
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const categoryParam = url.searchParams.get("category");
  const category =
    categoryParam === "ON_CAMPUS" || categoryParam === "OFF_CAMPUS"
      ? (categoryParam as WorkplaceCategory)
      : null;
  const maxTransitParam = url.searchParams.get("maxTransit");
  const sort = url.searchParams.get("sort") ?? "recent";

  const where: Prisma.WorkplaceWhereInput = {};
  if (q) where.name = { contains: q, mode: "insensitive" };

  if (cities.length > 0 && districts.length > 0) {
    where.OR = [{ city: { in: cities } }, { district: { in: districts } }];
  } else if (cities.length > 0) {
    where.city = { in: cities };
  } else if (districts.length > 0) {
    where.district = { in: districts };
  }

  if (category) where.category = category;
  if (maxTransitParam) {
    const max = Number(maxTransitParam);
    if (Number.isFinite(max)) {
      const transitOr = [
        { transitMinFromMainGate: { lte: max } },
        { transitMinFromBackGate: { lte: max } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: transitOr }];
        delete where.OR;
      } else {
        where.OR = transitOr;
      }
    }
  }

  let orderBy:
    | Prisma.WorkplaceOrderByWithRelationInput
    | Prisma.WorkplaceOrderByWithRelationInput[];
  switch (sort) {
    case "name":
      orderBy = { name: "asc" };
      break;
    case "reviews":
      orderBy = { reviews: { _count: "desc" } };
      break;
    case "recent":
    default:
      orderBy = { createdAt: "desc" };
  }

  const workplaces = await prisma.workplace.findMany({
    where,
    orderBy,
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
  });

  const result = workplaces.map((wp) => {
    const ratings = wp.reviews
      .map((r) => r.overallRating)
      .filter((r): r is number => r !== null);
    const avgRating =
      ratings.length > 0
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : null;
    const { reviews: _reviews, _count, ...rest } = wp;
    void _reviews;
    return {
      ...rest,
      reviewCount: _count.reviews,
      avgRating,
    };
  });

  return NextResponse.json({ workplaces: result });
}
