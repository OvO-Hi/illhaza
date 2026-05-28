import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { WorkplaceCategory } from "@prisma/client";
import { searchNaverPlaces, type NaverPlace } from "@/lib/naver";

const querySchema = z.object({
  q: z.string().min(1).max(100),
  includeExternal: z
    .string()
    .optional()
    .transform((v) => v !== "false"),
});

type SimilarityRow = {
  id: string;
  name: string;
  department: string | null;
  externalPlaceId: string | null;
  isManualEntry: boolean;
  address: string;
  city: string;
  district: string;
  latitude: number;
  longitude: number;
  category: WorkplaceCategory;
  transitMinFromMainGate: number | null;
  transitMinFromBackGate: number | null;
  similarity: number;
};

export async function GET(req: NextRequest) {
  try {
    await requireUser();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    q: url.searchParams.get("q") ?? "",
    includeExternal: url.searchParams.get("includeExternal") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid query" }, { status: 400 });
  }
  const { q, includeExternal } = parsed.data;

  // 1) DB pg_trgm 유사도 검색
  const existing = await prisma.$queryRaw<SimilarityRow[]>`
    SELECT
      id::text,
      name::text,
      department::text,
      "externalPlaceId"::text,
      "isManualEntry"::bool,
      address::text,
      city::text,
      district::text,
      latitude::float8,
      longitude::float8,
      category::text,
      "transitMinFromMainGate"::int4,
      "transitMinFromBackGate"::int4,
      similarity(name, ${q})::float4 AS similarity
    FROM "Workplace"
    WHERE similarity(name, ${q}) > 0.2
    ORDER BY similarity DESC
    LIMIT 10
  `;

  // 2) 네이버 검색 (옵션, DB에 이미 있는 externalPlaceId는 제외)
  let externalPlaces: NaverPlace[] = [];
  if (includeExternal) {
    try {
      externalPlaces = await searchNaverPlaces(q, { display: 5 });
      if (externalPlaces.length > 0) {
        const existingExternal = await prisma.workplace.findMany({
          where: { externalPlaceId: { in: externalPlaces.map((p) => p.id) } },
          select: { externalPlaceId: true },
        });
        const existingIds = new Set(
          existingExternal.map((w) => w.externalPlaceId),
        );
        externalPlaces = externalPlaces.filter((p) => !existingIds.has(p.id));
      }
    } catch (e) {
      console.error("Naver search failed:", e);
      // 네이버 실패해도 DB 결과는 반환
    }
  }

  return NextResponse.json({
    existing: existing.map((row) => {
      const { similarity: _similarity, ...rest } = row;
      void _similarity;
      return rest;
    }),
    external: externalPlaces,
  });
}
