"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { WorkplaceMap } from "@/components/WorkplaceMap";

type ExistingWorkplace = {
  id: string;
  name: string;
  address: string;
  district: string;
  latitude: number;
  longitude: number;
  category: "ON_CAMPUS" | "OFF_CAMPUS";
  transitMinFromMainGate: number | null;
  transitMinFromBackGate: number | null;
};

type ExternalCandidate = {
  id: string;
  placeName: string;
  addressName: string;
  roadAddressName: string;
  latitude: number;
  longitude: number;
  district: string;
  categoryName: string;
};

export type ListedWorkplace = ExistingWorkplace & {
  _count?: { reviews: number };
};

export function WorkplaceDevClient({
  initialList,
}: {
  initialList: ListedWorkplace[];
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [existing, setExisting] = useState<ExistingWorkplace[]>([]);
  const [external, setExternal] = useState<ExternalCandidate[]>([]);
  const [list, setList] = useState<ListedWorkplace[]>(initialList);
  const [selected, setSelected] = useState<ListedWorkplace | null>(null);

  const refreshList = async () => {
    try {
      const res = await fetch("/api/workplaces");
      if (!res.ok) return;
      const data = (await res.json()) as { workplaces: ListedWorkplace[] };
      setList(data.workplaces);
    } catch {
      // 무시
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || searching) return;
    setSearching(true);
    try {
      const params = new URLSearchParams({ q: query.trim() });
      const res = await fetch(`/api/workplaces/search?${params}`);
      const data: {
        existing?: ExistingWorkplace[];
        external?: ExternalCandidate[];
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "검색 실패");
        return;
      }
      setExisting(data.existing ?? []);
      setExternal(data.external ?? []);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSearching(false);
    }
  };

  const handleCreate = async (candidate: ExternalCandidate) => {
    if (creating) return;
    setCreating(candidate.id);
    try {
      const res = await fetch("/api/workplaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          externalPlaceId: candidate.id,
          externalData: {
            placeName: candidate.placeName,
            addressName: candidate.addressName,
            roadAddressName: candidate.roadAddressName,
            latitude: candidate.latitude,
            longitude: candidate.longitude,
            district: candidate.district,
          },
        }),
      });
      const data: {
        workplace?: ListedWorkplace;
        created?: boolean;
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.workplace) {
        toast.error(data.error ?? "생성 실패");
        return;
      }
      toast.success(
        data.created ? "새 근로지 등록 완료" : "이미 등록된 근로지입니다",
      );
      const workplace = data.workplace;
      setExternal((prev) => prev.filter((p) => p.id !== candidate.id));
      setExisting((prev) =>
        prev.some((w) => w.id === workplace.id) ? prev : [workplace, ...prev],
      );
      await refreshList();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setCreating(null);
    }
  };

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-6">
      <header>
        <h1 className="text-xl font-bold text-brand">근로지 (dev)</h1>
        <p className="text-xs text-muted-foreground">
          검색 → 네이버 결과 클릭 시 DB에 등록됩니다.
        </p>
      </header>

      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="근로지명 검색 (예: 서대문 자연사 박물관)"
          inputMode="search"
        />
        <Button
          type="submit"
          disabled={searching || !query.trim()}
          className="bg-brand text-white hover:bg-brand-700"
        >
          {searching ? "..." : "검색"}
        </Button>
      </form>

      {existing.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            DB에 이미 있는 근로지
          </h2>
          <div className="space-y-2">
            {existing.map((w) => (
              <WorkplaceCard
                key={w.id}
                workplace={w}
                onClick={() => setSelected({ ...w })}
              />
            ))}
          </div>
        </section>
      )}

      {external.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            네이버 검색 결과 (클릭해서 등록)
          </h2>
          <div className="space-y-2">
            {external.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => void handleCreate(c)}
                disabled={creating === c.id}
                className="block w-full text-left"
              >
                <Card className="transition hover:border-brand-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {c.placeName}
                      {creating === c.id && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          등록 중...
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1 pb-3 text-xs text-muted-foreground">
                    <div>{c.roadAddressName || c.addressName}</div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{c.district}</Badge>
                      {c.categoryName && (
                        <span className="truncate">{c.categoryName}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </section>
      )}

      {selected && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">
            상세
          </h2>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{selected.name}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <WorkplaceMap
                latitude={selected.latitude}
                longitude={selected.longitude}
                height={180}
              />
              <div className="space-y-1 text-xs">
                <div>{selected.address}</div>
                <div className="flex flex-wrap gap-2">
                  <Badge>{selected.district}</Badge>
                  <Badge
                    className={
                      selected.category === "ON_CAMPUS"
                        ? "bg-brand text-white"
                        : ""
                    }
                  >
                    {selected.category === "ON_CAMPUS" ? "교내" : "교외"}
                  </Badge>
                  {selected.transitMinFromMainGate !== null && (
                    <Badge variant="outline">
                      정문 {selected.transitMinFromMainGate}분
                    </Badge>
                  )}
                  {selected.transitMinFromBackGate !== null && (
                    <Badge variant="outline">
                      후문 {selected.transitMinFromBackGate}분
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-muted-foreground">
          전체 근로지 ({list.length})
        </h2>
        {list.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            아직 등록된 근로지가 없습니다.
          </p>
        ) : (
          <div className="space-y-2">
            {list.map((w) => (
              <WorkplaceCard
                key={w.id}
                workplace={w}
                onClick={() => setSelected(w)}
                reviewCount={w._count?.reviews}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function WorkplaceCard({
  workplace,
  onClick,
  reviewCount,
}: {
  workplace: ExistingWorkplace;
  onClick: () => void;
  reviewCount?: number;
}) {
  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <Card className="transition hover:border-brand-400">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">
            {workplace.name}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pb-3 text-xs text-muted-foreground">
          <div>{workplace.address}</div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{workplace.district}</Badge>
            <Badge variant="outline">
              {workplace.category === "ON_CAMPUS" ? "교내" : "교외"}
            </Badge>
            {workplace.transitMinFromMainGate !== null && (
              <Badge variant="outline">
                정문 {workplace.transitMinFromMainGate}분
              </Badge>
            )}
            {workplace.transitMinFromBackGate !== null && (
              <Badge variant="outline">
                후문 {workplace.transitMinFromBackGate}분
              </Badge>
            )}
            {reviewCount !== undefined && reviewCount > 0 && (
              <Badge>후기 {reviewCount}</Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </button>
  );
}
