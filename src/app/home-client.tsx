"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ChevronDown, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  WorkplaceCard,
  type WorkplaceCardData,
} from "@/components/WorkplaceCard";
import { EmptyState } from "@/components/EmptyState";

export type WorkplaceListItem = WorkplaceCardData;
export type CityGroup = { city: string; districts: string[] };

const TRANSIT_OPTIONS = [
  { value: "", label: "전체" },
  { value: "15", label: "15분 이내" },
  { value: "30", label: "30분 이내" },
  { value: "60", label: "1시간 이내" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "최신순" },
  { value: "reviews", label: "후기 많은 순" },
  { value: "name", label: "이름순" },
];

export function HomeClient({
  initialWorkplaces,
  initialCityGroups,
  userRole,
  totalWorkplaceCount,
  totalReviewCount,
}: {
  initialWorkplaces: WorkplaceListItem[];
  initialCityGroups: CityGroup[];
  userRole: "USER" | "ADMIN";
  totalWorkplaceCount: number;
  totalReviewCount: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [workplaces, setWorkplaces] = useState(initialWorkplaces);
  const [cityGroups] = useState(initialCityGroups);

  // 입력 박스의 현재 값. fetch는 별도로 트리거됨.
  const [qInput, setQInput] = useState(searchParams.get("q") ?? "");
  // 실제 query에 사용되는 값 (검색 버튼/엔터로만 갱신)
  const [committedQ, setCommittedQ] = useState(searchParams.get("q") ?? "");

  const [category, setCategory] = useState(searchParams.get("category") ?? "");
  const [selectedCities, setSelectedCities] = useState<string[]>(
    (searchParams.get("city") ?? "").split(",").filter(Boolean),
  );
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>(
    (searchParams.get("district") ?? "").split(",").filter(Boolean),
  );
  const [maxTransit, setMaxTransit] = useState(
    searchParams.get("maxTransit") ?? "",
  );
  const [sort, setSort] = useState(searchParams.get("sort") ?? "recent");
  const [districtSheetOpen, setDistrictSheetOpen] = useState(false);

  const cityKey = selectedCities.join(",");
  const districtKey = selectedDistricts.join(",");
  const isFirstRun = useRef(true);

  useEffect(() => {
    // 첫 렌더에서 server prop으로 들어온 initialWorkplaces를 그대로 두려면 fetch 생략.
    // 그러나 URL에 query가 있는 채로 진입한 경우는 서버 prop과 다를 수 있어 한 번 fetch.
    if (isFirstRun.current) {
      isFirstRun.current = false;
      const hasInitialQuery =
        !!committedQ ||
        !!category ||
        !!cityKey ||
        !!districtKey ||
        !!maxTransit ||
        sort !== "recent";
      if (!hasInitialQuery) return;
    }

    // setState는 비동기 fetch 결과에서만 호출 → react-hooks/set-state-in-effect 회피
    const ac = new AbortController();
    void (async () => {
      const params = new URLSearchParams();
      if (committedQ) params.set("q", committedQ);
      if (category) params.set("category", category);
      if (cityKey) params.set("city", cityKey);
      if (districtKey) params.set("district", districtKey);
      if (maxTransit) params.set("maxTransit", maxTransit);
      if (sort !== "recent") params.set("sort", sort);

      const queryStr = params.toString();
      router.replace(queryStr ? `/?${queryStr}` : "/", { scroll: false });

      try {
        const res = await fetch(`/api/workplaces?${params}`, {
          signal: ac.signal,
        });
        if (!res.ok) {
          toast.error("목록을 불러오지 못했습니다");
          return;
        }
        const data = (await res.json()) as {
          workplaces: WorkplaceListItem[];
        };
        setWorkplaces(data.workplaces);
      } catch (e) {
        if ((e as Error).name !== "AbortError") {
          toast.error("네트워크 오류");
        }
      }
    })();

    return () => ac.abort();
  }, [committedQ, category, cityKey, districtKey, maxTransit, sort, router]);

  const handleSearch = () => {
    setCommittedQ(qInput.trim());
  };

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSearch();
    }
  };

  const toggleCity = (city: string, districtsInCity: string[]) => {
    setSelectedCities((prev) =>
      prev.includes(city) ? prev.filter((c) => c !== city) : [...prev, city],
    );
    // 시 전체 체크 시 해당 시의 개별 구 선택은 제거 (중복 방지)
    if (!selectedCities.includes(city)) {
      setSelectedDistricts((prev) =>
        prev.filter((d) => !districtsInCity.includes(d)),
      );
    }
  };

  const toggleDistrict = (district: string) => {
    setSelectedDistricts((prev) =>
      prev.includes(district)
        ? prev.filter((d) => d !== district)
        : [...prev, district],
    );
  };

  const clearFilters = () => {
    setCategory("");
    setSelectedCities([]);
    setSelectedDistricts([]);
    setMaxTransit("");
  };

  const filterChipCount = selectedCities.length + selectedDistricts.length;
  const hasFilters =
    !!category || filterChipCount > 0 || !!maxTransit;

  return (
    <main
      className="min-h-screen bg-background pb-32"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-brand">일하자</h1>
          <div className="flex items-center gap-2">
            {userRole === "ADMIN" && (
              <Link href="/admin">
                <Button size="sm" variant="outline">
                  어드민
                </Button>
              </Link>
            )}
            <Link href="/contact">
              <Button size="sm" variant="outline">
                문의
              </Button>
            </Link>
            <Link href="/account">
              <Button size="sm" variant="outline">
                내 계정
              </Button>
            </Link>
          </div>
        </div>

        <div className="space-y-3 px-4 pb-3">
          <div className="flex gap-2">
            <Input
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="근로지명 검색"
              inputMode="search"
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleSearch}
              className="bg-brand text-white hover:bg-brand-700"
            >
              검색
            </Button>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <FilterChip
              active={category === ""}
              onClick={() => setCategory("")}
              label="전체"
            />
            <FilterChip
              active={category === "ON_CAMPUS"}
              onClick={() => setCategory("ON_CAMPUS")}
              label="학내"
            />
            <FilterChip
              active={category === "OFF_CAMPUS"}
              onClick={() => setCategory("OFF_CAMPUS")}
              label="학외"
            />
            <Sheet
              open={districtSheetOpen}
              onOpenChange={setDistrictSheetOpen}
            >
              <SheetTrigger className={chipClasses(filterChipCount > 0)}>
                {filterChipCount > 0 ? `지역 ${filterChipCount}` : "지역"}
              </SheetTrigger>
              <SheetContent
                side="bottom"
                className="max-h-[80vh] overflow-y-auto"
              >
                <SheetHeader>
                  <SheetTitle>지역 선택</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {cityGroups.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      등록된 근로지가 없습니다.
                    </p>
                  ) : (
                    cityGroups.map(({ city, districts }) => (
                      <CityRow
                        key={city}
                        city={city}
                        districts={districts}
                        cityChecked={selectedCities.includes(city)}
                        selectedDistricts={selectedDistricts}
                        onToggleCity={() => toggleCity(city, districts)}
                        onToggleDistrict={toggleDistrict}
                      />
                    ))
                  )}
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSelectedCities([]);
                      setSelectedDistricts([]);
                    }}
                  >
                    초기화
                  </Button>
                  <Button
                    onClick={() => setDistrictSheetOpen(false)}
                    className="bg-brand text-white hover:bg-brand-700"
                  >
                    적용
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            {TRANSIT_OPTIONS.map((opt) => (
              <FilterChip
                key={opt.value || "all-transit"}
                active={maxTransit === opt.value}
                onClick={() => setMaxTransit(opt.value)}
                label={`거리 ${opt.label}`}
              />
            ))}
            {hasFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="shrink-0 rounded-full border border-dashed border-muted-foreground px-3 py-1 text-xs text-muted-foreground"
              >
                필터 초기화
              </button>
            )}
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              근로지 {totalWorkplaceCount}개 · 후기 {totalReviewCount}개
            </span>
            <div className="flex gap-1">
              {SORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSort(s.value)}
                  className={
                    sort === s.value
                      ? "rounded-full bg-brand px-3 py-1 text-white"
                      : "rounded-full px-3 py-1 text-muted-foreground"
                  }
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <section className="space-y-2 px-4 py-4">
        {workplaces.length === 0 ? (
          <EmptyState
            icon={Search}
            title="조건에 맞는 근로지가 없어요"
            description="검색어나 필터를 조정해보세요"
          />
        ) : (
          workplaces.map((wp) => <WorkplaceCard key={wp.id} wp={wp} />)
        )}
      </section>

      <Link
        href="/reviews/new"
        className="fixed right-4 z-20 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-700"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <Plus className="h-4 w-4" />
        후기 작성
      </Link>
    </main>
  );
}

function CityRow({
  city,
  districts,
  cityChecked,
  selectedDistricts,
  onToggleCity,
  onToggleDistrict,
}: {
  city: string;
  districts: string[];
  cityChecked: boolean;
  selectedDistricts: string[];
  onToggleCity: () => void;
  onToggleDistrict: (d: string) => void;
}) {
  const cityCheckboxId = `city-${city}`;
  return (
    <Collapsible className="rounded-md border">
      <div className="flex items-center justify-between p-3">
        <label
          htmlFor={cityCheckboxId}
          className="flex flex-1 cursor-pointer items-center gap-3"
        >
          <Checkbox
            id={cityCheckboxId}
            checked={cityChecked}
            onCheckedChange={onToggleCity}
          />
          <span className="text-sm font-medium">{city} 전체</span>
        </label>
        <CollapsibleTrigger className="rounded p-1 text-muted-foreground hover:bg-muted data-[panel-open]:rotate-180">
          <ChevronDown className="h-4 w-4" />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent>
        <div className="space-y-1 border-t bg-muted/30 px-3 py-2">
          {districts.map((d) => {
            const id = `district-${city}-${d}`;
            return (
              <label
                key={d}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-md p-2 hover:bg-muted"
              >
                <Checkbox
                  id={id}
                  checked={selectedDistricts.includes(d)}
                  onCheckedChange={() => onToggleDistrict(d)}
                />
                <span className="text-sm">{d}</span>
              </label>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function FilterChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button type="button" onClick={onClick} className={chipClasses(active)}>
      {label}
    </button>
  );
}

function chipClasses(active: boolean): string {
  return active
    ? "shrink-0 rounded-full bg-brand px-3 py-1 text-xs font-medium text-white"
    : "shrink-0 rounded-full border px-3 py-1 text-xs text-foreground hover:bg-muted";
}
