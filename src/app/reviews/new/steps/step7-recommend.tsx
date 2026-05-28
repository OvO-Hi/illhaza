"use client";

import { useReviewDraft } from "../store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { RECOMMEND_TAG_LABELS } from "@/lib/labels";
import { StepFooter } from "./_footer";

export function Step7Recommend({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const recommendedFor = useReviewDraft((s) => s.recommendedFor);
  const overallRating = useReviewDraft((s) => s.overallRating);
  const set = useReviewDraft((s) => s.set);
  const toggle = useReviewDraft((s) => s.toggleArrayValue);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">어떤 사람에게 추천하시나요?</h2>
        <p className="text-sm text-muted-foreground">
          추천 대상은 선택 항목이고, 종합 추천도는 필수입니다.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">추천 대상 (선택, 다중)</h3>
        <div className="space-y-2">
          {Object.entries(RECOMMEND_TAG_LABELS).map(([value, label]) => {
            const id = `rec-${value}`;
            const checked = recommendedFor.includes(value);
            return (
              <label
                key={value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggle("recommendedFor", value)}
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
        </div>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">종합 추천도 (1~5점)</h3>
        <RadioGroup
          value={overallRating ? String(overallRating) : ""}
          onValueChange={(v) => set("overallRating", Number(v))}
          className="flex justify-between"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const id = `rating-${n}`;
            return (
              <label
                key={n}
                htmlFor={id}
                className="flex flex-1 cursor-pointer flex-col items-center gap-1 rounded-md border p-3 hover:bg-muted"
              >
                <RadioGroupItem id={id} value={String(n)} />
                <span className="text-xs">{n}</span>
              </label>
            );
          })}
        </RadioGroup>
      </section>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        canProceed={!!overallRating}
      />
    </div>
  );
}
