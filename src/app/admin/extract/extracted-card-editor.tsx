"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CITIES } from "@/lib/cities";
import type { ExtractedReview } from "@/lib/claude";
import {
  WORK_PERIOD_TYPE_LABELS,
  WORK_TERM_LABELS,
  WORK_DURATION_LABELS,
  INCOME_BRACKET_LABELS,
  TASK_TYPE_LABELS,
  STUDY_POSSIBILITY_LABELS,
  WORK_ENVIRONMENT_LABELS,
  COWORKER_TYPE_LABELS,
  RECOMMEND_TAG_LABELS,
  AUTONOMY_SCORE_LABELS,
} from "@/lib/labels";
import type { ExtractedCard } from "./extract-client";

type WorkplaceCandidate = {
  id: string;
  name: string;
  department: string | null;
  address: string;
  city?: string;
  district: string;
  category: "ON_CAMPUS" | "OFF_CAMPUS";
};

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from(
  { length: CURRENT_YEAR - 2015 + 1 },
  (_, i) => CURRENT_YEAR - i,
);

export function ExtractedCardEditor({
  index,
  card,
  onMatched,
  onSaved,
}: {
  index: number;
  card: ExtractedCard;
  onMatched: (workplaceId: string, workplaceLabel: string) => void;
  onSaved: () => void;
}) {
  const [edited, setEdited] = useState<ExtractedReview>(card.extracted);
  const [saving, setSaving] = useState(false);

  // 근로지 매칭
  const initialSearch = card.extracted.workplaceDepartment
    ? `${card.extracted.workplaceName} ${card.extracted.workplaceDepartment}`
    : card.extracted.workplaceName;
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [candidates, setCandidates] = useState<WorkplaceCandidate[]>([]);

  // 수동 등록 폼
  const [manualOpen, setManualOpen] = useState(false);
  const [mName, setMName] = useState(card.extracted.workplaceName);
  const [mDept, setMDept] = useState(card.extracted.workplaceDepartment ?? "");
  const [mRoadAddress, setMRoadAddress] = useState("");
  const [mCity, setMCity] = useState("");
  const [mDistrict, setMDistrict] = useState("");
  const [mCategory, setMCategory] = useState<
    "ON_CAMPUS" | "OFF_CAMPUS" | null
  >(null);
  const [submittingManual, setSubmittingManual] = useState(false);

  // ─── 작은 헬퍼 ─────────────────────────────
  const update = <K extends keyof ExtractedReview>(
    key: K,
    value: ExtractedReview[K],
  ) => setEdited((prev) => ({ ...prev, [key]: value }));

  function toggleArr<T extends string>(arr: T[], value: T): T[] {
    return arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
  }

  const labelFor = (name: string, dept: string | null) =>
    dept ? `${name} — ${dept}` : name;

  // ─── 검색 ─────────────────────────────
  const runSearch = async () => {
    const q = searchQuery.trim();
    if (!q || searching) return;
    setSearching(true);
    setSearched(true);
    try {
      const res = await fetch(
        `/api/workplaces/search?q=${encodeURIComponent(q)}&includeExternal=false`,
      );
      const data: {
        existing?: WorkplaceCandidate[];
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "검색 실패");
        return;
      }
      setCandidates(data.existing ?? []);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSearching(false);
    }
  };

  const selectCandidate = (w: WorkplaceCandidate) => {
    onMatched(w.id, labelFor(w.name, w.department));
    toast.success("근로지 매칭 완료");
  };

  const submitManual = async () => {
    if (submittingManual) return;
    const name = mName.trim();
    const roadAddress = mRoadAddress.trim();
    const city = mCity.trim();
    const district = mDistrict.trim();
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
    if (!mCategory) {
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
          department: mDept.trim() || undefined,
          roadAddress,
          city,
          district,
          category: mCategory,
        }),
      });
      const data: {
        workplace?: { id: string; name: string; department: string | null };
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.workplace) {
        toast.error(data.error ?? "근로지 등록 실패");
        return;
      }
      onMatched(
        data.workplace.id,
        labelFor(data.workplace.name, data.workplace.department),
      );
      setManualOpen(false);
      toast.success("근로지 등록 완료");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmittingManual(false);
    }
  };

  // ─── 저장 ─────────────────────────────
  const handleSave = async () => {
    if (saving) return;
    if (!card.workplaceId) {
      toast.error("근로지를 먼저 매칭해주세요");
      return;
    }
    if (edited.freeText.trim().length === 0) {
      toast.error("자유 작성 내용이 비어있습니다");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/admin/reviews", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          workplaceId: card.workplaceId,
          workPeriodType: edited.workPeriodType,
          workYear: edited.workYear,
          workYearPublic: edited.workYearPublic,
          workTerm: edited.workTerm,
          workTermPublic: edited.workTermPublic,
          workDuration: edited.workDuration,
          incomeBracket: edited.incomeBracket,
          incomeBracketPublic: edited.incomeBracketPublic,
          tasks: edited.tasks,
          tasksOtherText: edited.tasksOtherText,
          autonomyScore: edited.autonomyScore,
          studyPossibility: edited.studyPossibility,
          workEnvironment: edited.workEnvironment,
          coworkerTypes: edited.coworkerTypes,
          recommendedFor: edited.recommendedFor,
          overallRating: edited.overallRating,
          freeText: edited.freeText,
        }),
      });
      const data: { review?: { id: string }; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "저장 실패");
        return;
      }
      onSaved();
      toast.success("저장 완료");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSaving(false);
    }
  };

  if (card.saved) {
    return (
      <Card className="border-brand-200 bg-brand-50/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-muted-foreground">후기 #{index}</div>
            <div className="font-medium">{card.workplaceLabel}</div>
          </div>
          <Badge className="bg-brand text-white">저장됨</Badge>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <CardHeader className="px-0 pb-3 pt-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">후기 #{index}</CardTitle>
          <Badge variant="outline" className="text-xs">
            AI 추출
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 px-0 pb-0">
        {/* 근로지 매칭 */}
        <section className="space-y-3 rounded-md border bg-muted/30 p-3">
          <div className="space-y-1">
            <div className="text-xs font-semibold text-muted-foreground">
              AI 추출 근로지
            </div>
            <div className="text-sm">
              <span className="font-medium">
                {card.extracted.workplaceName}
              </span>
              {card.extracted.workplaceDepartment && (
                <span className="ml-1 text-muted-foreground">
                  — {card.extracted.workplaceDepartment}
                </span>
              )}
            </div>
            {card.extracted.locationHint && (
              <div className="text-xs text-muted-foreground">
                위치 힌트: {card.extracted.locationHint}
              </div>
            )}
          </div>

          {card.workplaceId && card.workplaceLabel ? (
            <div className="flex items-center justify-between rounded-md border border-brand-200 bg-background px-3 py-2">
              <div className="text-sm">
                선택됨:{" "}
                <span className="font-medium">{card.workplaceLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => onMatched("", "")}
                className="text-xs text-muted-foreground underline"
              >
                변경
              </button>
            </div>
          ) : (
            <>
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void runSearch();
                    }
                  }}
                  placeholder="DB에서 찾기"
                  className="flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void runSearch()}
                  disabled={!searchQuery.trim() || searching}
                  className="bg-brand text-white hover:bg-brand-700"
                >
                  {searching ? "..." : "검색"}
                </Button>
              </div>

              {candidates.length > 0 && (
                <div className="space-y-1">
                  {candidates.map((w) => (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => selectCandidate(w)}
                      className="block w-full rounded-md border bg-background p-2 text-left text-sm hover:border-brand-400"
                    >
                      <div className="font-medium">
                        {w.name}
                        {w.department && (
                          <span className="ml-1 text-muted-foreground">
                            — {w.department}
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {w.address}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searched &&
                !searching &&
                candidates.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    DB에 일치하는 근로지가 없습니다. 아래로 직접 등록하세요.
                  </p>
                )}

              <Collapsible open={manualOpen} onOpenChange={setManualOpen}>
                <CollapsibleTrigger className="flex w-full items-center justify-between rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground hover:border-brand-400 hover:text-foreground">
                  <span>+ 직접 등록</span>
                  <ChevronDown
                    className={`h-4 w-4 transition-transform ${manualOpen ? "rotate-180" : ""}`}
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 space-y-2 rounded-md border bg-background p-3">
                  <div className="space-y-1">
                    <Label>근로지명 *</Label>
                    <Input
                      value={mName}
                      onChange={(e) => setMName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>부서 (선택)</Label>
                    <Input
                      value={mDept}
                      onChange={(e) => setMDept(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>도로명 주소 *</Label>
                    <Input
                      value={mRoadAddress}
                      onChange={(e) => setMRoadAddress(e.target.value)}
                      placeholder="예: 서울특별시 서대문구 통일로 11길 27"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>시·도 *</Label>
                      <select
                        value={mCity}
                        onChange={(e) => setMCity(e.target.value)}
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
                      <Label>시·군·구 *</Label>
                      <Input
                        value={mDistrict}
                        onChange={(e) => setMDistrict(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label>학내/학외 *</Label>
                    <div className="flex gap-2">
                      <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted">
                        <input
                          type="radio"
                          name={`mcat-${card.id}`}
                          checked={mCategory === "ON_CAMPUS"}
                          onChange={() => setMCategory("ON_CAMPUS")}
                        />
                        <span>학내</span>
                      </label>
                      <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-muted">
                        <input
                          type="radio"
                          name={`mcat-${card.id}`}
                          checked={mCategory === "OFF_CAMPUS"}
                          onChange={() => setMCategory("OFF_CAMPUS")}
                        />
                        <span>학외</span>
                      </label>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => void submitManual()}
                    disabled={submittingManual}
                    className="w-full bg-brand text-white hover:bg-brand-700"
                  >
                    {submittingManual ? "등록 중..." : "등록 후 매칭"}
                  </Button>
                </CollapsibleContent>
              </Collapsible>
            </>
          )}
        </section>

        {/* 시기 */}
        <Group title="근무 시기">
          <NullableSelect
            label="형태"
            value={edited.workPeriodType}
            onChange={(v) =>
              update(
                "workPeriodType",
                v as ExtractedReview["workPeriodType"],
              )
            }
            options={Object.entries(WORK_PERIOD_TYPE_LABELS)}
          />
          <div className="space-y-1">
            <Label>연도</Label>
            <select
              value={edited.workYear ?? ""}
              onChange={(e) =>
                update("workYear", e.target.value ? Number(e.target.value) : null)
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">(미정)</option>
              {YEARS.map((y) => (
                <option key={y} value={y}>
                  {y}년
                </option>
              ))}
            </select>
            {edited.workYear !== null && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={!edited.workYearPublic}
                  onCheckedChange={(v) => update("workYearPublic", v !== true)}
                />
                <span>연도 비공개</span>
              </label>
            )}
          </div>
          <div className="space-y-1">
            <NullableSelect
              label="학기"
              value={edited.workTerm}
              onChange={(v) =>
                update("workTerm", v as ExtractedReview["workTerm"])
              }
              options={Object.entries(WORK_TERM_LABELS)}
            />
            {edited.workTerm !== null && (
              <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
                <Checkbox
                  checked={!edited.workTermPublic}
                  onCheckedChange={(v) => update("workTermPublic", v !== true)}
                />
                <span>학기 비공개</span>
              </label>
            )}
          </div>
          <NullableSelect
            label="기간"
            value={edited.workDuration}
            onChange={(v) =>
              update("workDuration", v as ExtractedReview["workDuration"])
            }
            options={Object.entries(WORK_DURATION_LABELS)}
          />
        </Group>

        {/* 분위 */}
        <Group title="분위">
          <NullableSelect
            label="분위 (LOW/MID/HIGH)"
            value={edited.incomeBracket}
            onChange={(v) =>
              update("incomeBracket", v as ExtractedReview["incomeBracket"])
            }
            options={Object.entries(INCOME_BRACKET_LABELS)}
          />
          <div className="flex items-center justify-between">
            <Label>리뷰에 공개</Label>
            <Switch
              checked={edited.incomeBracketPublic}
              onCheckedChange={(v) => update("incomeBracketPublic", v)}
            />
          </div>
        </Group>

        {/* 업무 */}
        <Group title="업무 (다중)">
          <div className="grid grid-cols-2 gap-1">
            {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
              <label
                key={value}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted"
              >
                <Checkbox
                  checked={edited.tasks.includes(
                    value as ExtractedReview["tasks"][number],
                  )}
                  onCheckedChange={() =>
                    update(
                      "tasks",
                      toggleArr(
                        edited.tasks,
                        value as ExtractedReview["tasks"][number],
                      ),
                    )
                  }
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
          {edited.tasks.includes("OTHER") && (
            <div className="space-y-1">
              <Label>기타 업무 설명 (20자 이상)</Label>
              <Textarea
                value={edited.tasksOtherText ?? ""}
                onChange={(e) =>
                  update("tasksOtherText", e.target.value.slice(0, 500))
                }
                rows={2}
                className="resize-none"
              />
            </div>
          )}
        </Group>

        {/* 자율도 & 공부 */}
        <Group title="자율도 & 공부">
          <div className="space-y-1">
            <Label>자율도 1~5</Label>
            <select
              value={edited.autonomyScore ?? ""}
              onChange={(e) =>
                update(
                  "autonomyScore",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">(미정)</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {AUTONOMY_SCORE_LABELS[n]}
                </option>
              ))}
            </select>
          </div>
          <NullableSelect
            label="공부 가능"
            value={edited.studyPossibility}
            onChange={(v) =>
              update(
                "studyPossibility",
                v as ExtractedReview["studyPossibility"],
              )
            }
            options={Object.entries(STUDY_POSSIBILITY_LABELS)}
          />
        </Group>

        {/* 환경 */}
        <Group title="근무 환경">
          <NullableSelect
            label="공간"
            value={edited.workEnvironment}
            onChange={(v) =>
              update(
                "workEnvironment",
                v as ExtractedReview["workEnvironment"],
              )
            }
            options={Object.entries(WORK_ENVIRONMENT_LABELS)}
          />
          <div className="space-y-1">
            <Label>함께 일한 사람 (다중)</Label>
            <div className="grid grid-cols-3 gap-1">
              {Object.entries(COWORKER_TYPE_LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted"
                >
                  <Checkbox
                    checked={edited.coworkerTypes.includes(
                      value as ExtractedReview["coworkerTypes"][number],
                    )}
                    onCheckedChange={() =>
                      update(
                        "coworkerTypes",
                        toggleArr(
                          edited.coworkerTypes,
                          value as ExtractedReview["coworkerTypes"][number],
                        ),
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        </Group>

        {/* 추천 */}
        <Group title="추천">
          <div className="space-y-1">
            <Label>추천 대상 (다중)</Label>
            <div className="grid grid-cols-2 gap-1">
              {Object.entries(RECOMMEND_TAG_LABELS).map(([value, label]) => (
                <label
                  key={value}
                  className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs hover:bg-muted"
                >
                  <Checkbox
                    checked={edited.recommendedFor.includes(
                      value as ExtractedReview["recommendedFor"][number],
                    )}
                    onCheckedChange={() =>
                      update(
                        "recommendedFor",
                        toggleArr(
                          edited.recommendedFor,
                          value as ExtractedReview["recommendedFor"][number],
                        ),
                      )
                    }
                  />
                  <span>{label}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <Label>종합 추천도 1~5</Label>
            <select
              value={edited.overallRating ?? ""}
              onChange={(e) =>
                update(
                  "overallRating",
                  e.target.value ? Number(e.target.value) : null,
                )
              }
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">(미정)</option>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>
                  {n}점
                </option>
              ))}
            </select>
          </div>
        </Group>

        {/* 자유 작성 */}
        <Group title="자유 작성 *">
          <Textarea
            value={edited.freeText}
            onChange={(e) => update("freeText", e.target.value.slice(0, 5000))}
            rows={5}
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground">
            {edited.freeText.length} / 5000
          </div>
        </Group>

        <Button
          type="button"
          onClick={() => void handleSave()}
          disabled={
            saving ||
            !card.workplaceId ||
            edited.freeText.trim().length === 0
          }
          className="w-full bg-brand text-white hover:bg-brand-700"
        >
          {saving ? "저장 중..." : "이 후기 저장"}
        </Button>
      </CardContent>
    </Card>
  );
}

function Group({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
      {children}
    </section>
  );
}

function NullableSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  options: Array<[string, string]>;
}) {
  return (
    <div className="space-y-1">
      <Label>{label}</Label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">(미정)</option>
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  );
}
