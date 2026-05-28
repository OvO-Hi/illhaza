"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useReviewDraft } from "../store";

type ExistingWorkplace = {
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
  category: "ON_CAMPUS" | "OFF_CAMPUS";
};

type ExternalCandidate = {
  id: string;
  placeName: string;
  addressName: string;
  roadAddressName: string;
  latitude: number;
  longitude: number;
  city: string;
  district: string;
  categoryName: string;
};

const CITIES = [
  "서울특별시",
  "부산광역시",
  "대구광역시",
  "인천광역시",
  "광주광역시",
  "대전광역시",
  "울산광역시",
  "세종특별자치시",
  "경기도",
  "강원특별자치도",
  "충청북도",
  "충청남도",
  "전북특별자치도",
  "전라남도",
  "경상북도",
  "경상남도",
  "제주특별자치도",
];

type Category = "ON_CAMPUS" | "OFF_CAMPUS";

type DialogTarget =
  | { kind: "existing"; card: ExistingWorkplace }
  | { kind: "external"; card: ExternalCandidate };

function displayName(name: string, department: string | null | undefined) {
  return department ? `${name} — ${department}` : name;
}

export function Step1Workplace({ onNext }: { onNext: () => void }) {
  const setDraft = useReviewDraft((s) => s.set);
  const currentId = useReviewDraft((s) => s.workplaceId);
  const currentName = useReviewDraft((s) => s.workplaceName);

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [existing, setExisting] = useState<ExistingWorkplace[]>([]);
  const [external, setExternal] = useState<ExternalCandidate[]>([]);

  // 등록 다이얼로그 (외부 카드 클릭 또는 "다른 부서 추가")
  const [deptTarget, setDeptTarget] = useState<DialogTarget | null>(null);
  const [deptInput, setDeptInput] = useState("");
  const [deptCategory, setDeptCategory] = useState<Category | null>(null);
  const [submittingDept, setSubmittingDept] = useState(false);

  // 수동 등록 폼
  const [manualOpen, setManualOpen] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualDept, setManualDept] = useState("");
  const [manualRoadAddress, setManualRoadAddress] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualDistrict, setManualDistrict] = useState("");
  const [manualCategory, setManualCategory] = useState<Category | null>(null);
  const [submittingManual, setSubmittingManual] = useState(false);

  const runSearch = async () => {
    const q = query.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/workplaces/search?q=${encodeURIComponent(q)}`,
      );
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

  const onSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void runSearch();
    }
  };

  const selectExisting = (w: ExistingWorkplace) => {
    setDraft("workplaceId", w.id);
    setDraft("workplaceName", displayName(w.name, w.department));
    onNext();
  };

  const openExternalDialog = (c: ExternalCandidate) => {
    setDeptTarget({ kind: "external", card: c });
    setDeptInput("");
    setDeptCategory(null);
  };

  const openExistingDeptDialog = (w: ExistingWorkplace) => {
    setDeptTarget({ kind: "existing", card: w });
    setDeptInput("");
    setDeptCategory(w.category); // 기존 카드의 카테고리를 기본값으로
  };

  const submitDeptDialog = async () => {
    if (!deptTarget || submittingDept) return;
    if (!deptCategory) {
      toast.error("학내/학외를 선택해주세요");
      return;
    }
    const dept = deptInput.trim();
    // existing은 새 부서 추가가 목적이므로 부서명 필수.
    // external은 단순 클릭 = 부서 없이 등록 가능, 입력했으면 그 값으로 등록.
    if (deptTarget.kind === "existing" && dept.length === 0) {
      toast.error("부서명을 입력해주세요");
      return;
    }
    setSubmittingDept(true);
    try {
      let body: Record<string, unknown>;
      if (deptTarget.kind === "external") {
        const c = deptTarget.card;
        body = {
          mode: "external",
          externalPlaceId: c.id,
          externalData: {
            placeName: c.placeName,
            addressName: c.addressName,
            roadAddressName: c.roadAddressName,
            latitude: c.latitude,
            longitude: c.longitude,
            city: c.city,
            district: c.district,
          },
          department: dept || undefined,
          category: deptCategory,
        };
      } else {
        const w = deptTarget.card;
        if (!w.externalPlaceId) {
          toast.error("이 근로지는 외부 ID가 없어 부서 추가가 불가능합니다");
          return;
        }
        body = {
          mode: "external",
          externalPlaceId: w.externalPlaceId,
          externalData: {
            placeName: w.name,
            addressName: w.address,
            roadAddressName: w.address,
            latitude: w.latitude,
            longitude: w.longitude,
            city: w.city,
            district: w.district,
          },
          department: dept,
          category: deptCategory,
        };
      }

      const res = await fetch("/api/workplaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: {
        workplace?: { id: string; name: string; department: string | null };
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.workplace) {
        toast.error(data.error ?? "근로지 등록 실패");
        return;
      }
      setDraft("workplaceId", data.workplace.id);
      setDraft(
        "workplaceName",
        displayName(data.workplace.name, data.workplace.department),
      );
      setDeptTarget(null);
      setDeptInput("");
      setDeptCategory(null);
      onNext();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmittingDept(false);
    }
  };

  const submitManual = async () => {
    if (submittingManual) return;
    const name = manualName.trim();
    const roadAddress = manualRoadAddress.trim();
    const city = manualCity.trim();
    const district = manualDistrict.trim();

    if (!name) {
      toast.error("근로지명을 입력해주세요");
      return;
    }
    if (roadAddress.length < 5) {
      toast.error("도로명 주소를 입력해주세요");
      return;
    }
    if (!city) {
      toast.error("시·도를 선택해주세요");
      return;
    }
    if (!district) {
      toast.error("시·군·구를 입력해주세요");
      return;
    }
    if (!manualCategory) {
      toast.error("학내/학외를 선택해주세요");
      return;
    }

    setSubmittingManual(true);
    try {
      const res = await fetch("/api/workplaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          mode: "manual",
          name,
          department: manualDept.trim() || undefined,
          roadAddress,
          city,
          district,
          category: manualCategory,
        }),
      });
      const data: {
        workplace?: { id: string; name: string; department: string | null };
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.workplace) {
        toast.error(data.error ?? "수동 등록 실패");
        return;
      }
      setDraft("workplaceId", data.workplace.id);
      setDraft(
        "workplaceName",
        displayName(data.workplace.name, data.workplace.department),
      );
      onNext();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">어디서 근로하셨나요?</h2>
        <p className="text-sm text-muted-foreground">
          근로지명을 입력하고 검색 버튼(또는 엔터)을 눌러주세요.
        </p>
      </header>

      <div className="flex gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onSearchKey}
          placeholder="근로지명 검색 (예: 서대문 자연사 박물관)"
          inputMode="search"
          autoFocus
          className="flex-1"
        />
        <Button
          type="button"
          onClick={() => void runSearch()}
          disabled={!query.trim() || searching}
          className="bg-brand text-white hover:bg-brand-700"
        >
          {searching ? "검색 중..." : "검색"}
        </Button>
      </div>

      {currentId && currentName && !searched && (
        <div className="rounded-md border border-brand-200 bg-brand-50 px-3 py-2 text-sm">
          현재 선택: <span className="font-medium">{currentName}</span>
          <button
            type="button"
            onClick={onNext}
            className="ml-2 text-xs text-brand-700 underline"
          >
            계속하기
          </button>
        </div>
      )}

      {existing.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">
            DB에 이미 있는 근로지
          </h3>
          <div className="space-y-2">
            {existing.map((w) => (
              <div key={w.id} className="space-y-1">
                <button
                  type="button"
                  onClick={() => selectExisting(w)}
                  className="block w-full text-left"
                >
                  <Card className="transition hover:border-brand-400">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-semibold">
                        {w.name}
                        {w.department && (
                          <span className="ml-2 font-normal text-muted-foreground">
                            — {w.department}
                          </span>
                        )}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pb-3 text-xs text-muted-foreground">
                      <div>{w.address}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge variant="outline">{w.city}</Badge>
                        <Badge variant="outline">{w.district}</Badge>
                        <Badge variant="outline">
                          {w.category === "ON_CAMPUS" ? "교내" : "교외"}
                        </Badge>
                        {w.isManualEntry && (
                          <Badge variant="secondary">수동 등록</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </button>
                {w.externalPlaceId && (
                  <button
                    type="button"
                    onClick={() => openExistingDeptDialog(w)}
                    className="text-xs text-brand-700 underline"
                  >
                    + 다른 부서로 추가
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {external.length > 0 && (
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground">
            네이버 검색 결과 (클릭 시 학내/학외 선택 후 등록)
          </h3>
          <div className="space-y-2">
            {external.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => openExternalDialog(c)}
                className="block w-full text-left"
              >
                <Card className="transition hover:border-brand-400">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      {c.placeName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-3 text-xs text-muted-foreground">
                    <div>{c.roadAddressName || c.addressName}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline">{c.city}</Badge>
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

      {!searching &&
        searched &&
        existing.length === 0 &&
        external.length === 0 && (
          <p className="text-xs text-muted-foreground">검색 결과가 없습니다.</p>
        )}

      {/* 수동 등록 */}
      <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-brand-400 hover:text-foreground">
          <span>+ 검색 결과에 없나요? 직접 등록하기</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              manualOpen ? "rotate-180" : ""
            }`}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-3 space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1">
            <Label htmlFor="manual-name">근로지명 *</Label>
            <Input
              id="manual-name"
              value={manualName}
              onChange={(e) => setManualName(e.target.value)}
              placeholder="예: 서부교육지원청"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-dept">부서 (선택)</Label>
            <Input
              id="manual-dept"
              value={manualDept}
              onChange={(e) => setManualDept(e.target.value)}
              placeholder="예: 학교시설지원과"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="manual-address">도로명 주소 *</Label>
            <Input
              id="manual-address"
              value={manualRoadAddress}
              onChange={(e) => setManualRoadAddress(e.target.value)}
              placeholder="예: 서울특별시 서대문구 통일로 11길 27"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="manual-city">시·도 *</Label>
              <select
                id="manual-city"
                value={manualCity}
                onChange={(e) => setManualCity(e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              >
                <option value="" disabled>
                  선택
                </option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="manual-district">시·군·구 *</Label>
              <Input
                id="manual-district"
                value={manualDistrict}
                onChange={(e) => setManualDistrict(e.target.value)}
                placeholder="예: 서대문구"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>학내/학외 *</Label>
            <CategoryRadioGroup
              value={manualCategory}
              onChange={setManualCategory}
              idPrefix="manual"
            />
          </div>
          <Button
            type="button"
            onClick={() => void submitManual()}
            disabled={submittingManual}
            className="w-full bg-brand text-white hover:bg-brand-700"
          >
            {submittingManual ? "등록 중..." : "등록"}
          </Button>
          <p className="text-xs text-muted-foreground">
            도로명 주소는 네이버 Geocoding API로 좌표 변환되며, 학외 선택 시
            대중교통 시간이 자동 계산됩니다.
          </p>
        </CollapsibleContent>
      </Collapsible>

      {/* 부서 추가 다이얼로그 */}
      <Dialog
        open={deptTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeptTarget(null);
            setDeptInput("");
            setDeptCategory(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {deptTarget?.kind === "existing"
                ? `${deptTarget.card.name}에 다른 부서 추가`
                : deptTarget?.kind === "external"
                  ? `${deptTarget.card.placeName} 등록`
                  : "근로지 등록"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="dept-input">
              부서명{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {deptTarget?.kind === "external" ? "(선택)" : "*"}
              </span>
            </Label>
            <Input
              id="dept-input"
              value={deptInput}
              onChange={(e) => setDeptInput(e.target.value)}
              placeholder="예: 학교시설지원과"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label>학내/학외 *</Label>
            <CategoryRadioGroup
              value={deptCategory}
              onChange={setDeptCategory}
              idPrefix="dept"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeptTarget(null);
                setDeptInput("");
                setDeptCategory(null);
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => void submitDeptDialog()}
              disabled={
                submittingDept ||
                !deptCategory ||
                (deptTarget?.kind === "existing" && !deptInput.trim())
              }
              className="bg-brand text-white hover:bg-brand-700"
            >
              {submittingDept ? "등록 중..." : "등록"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CategoryRadioGroup({
  value,
  onChange,
  idPrefix,
}: {
  value: Category | null;
  onChange: (v: Category) => void;
  idPrefix: string;
}) {
  return (
    <RadioGroup
      value={value ?? ""}
      onValueChange={(v) => onChange(v as Category)}
      className="gap-2"
    >
      <label
        htmlFor={`${idPrefix}-on`}
        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted"
      >
        <RadioGroupItem
          id={`${idPrefix}-on`}
          value="ON_CAMPUS"
          className="mt-0.5"
        />
        <div className="text-sm">
          <p className="font-medium">학내 근로지</p>
          <p className="text-xs text-muted-foreground">
            이화여대 캠퍼스 내 (도보 이동)
          </p>
        </div>
      </label>
      <label
        htmlFor={`${idPrefix}-off`}
        className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted"
      >
        <RadioGroupItem
          id={`${idPrefix}-off`}
          value="OFF_CAMPUS"
          className="mt-0.5"
        />
        <div className="text-sm">
          <p className="font-medium">학외 근로지</p>
          <p className="text-xs text-muted-foreground">
            캠퍼스 밖 (대중교통 시간 자동 계산)
          </p>
        </div>
      </label>
    </RadioGroup>
  );
}
