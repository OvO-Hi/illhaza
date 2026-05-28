"use client";

import { useReviewDraft } from "../store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AUTONOMY_SCORE_LABELS,
  STUDY_POSSIBILITY_LABELS,
} from "@/lib/labels";
import { StepFooter } from "./_footer";

export function Step5Autonomy({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const autonomyScore = useReviewDraft((s) => s.autonomyScore);
  const studyPossibility = useReviewDraft((s) => s.studyPossibility);
  const set = useReviewDraft((s) => s.set);

  const canProceed = !!autonomyScore && !!studyPossibility;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">근무 중 자율도는 어땠나요?</h2>
        <p className="text-sm text-muted-foreground">
          업무 강도와 개인 공부 가능 여부를 알려주세요.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">자율도 (1~5점)</h3>
        <RadioGroup
          value={autonomyScore ? String(autonomyScore) : ""}
          onValueChange={(v) => set("autonomyScore", Number(v))}
          className="gap-2"
        >
          {[1, 2, 3, 4, 5].map((n) => {
            const id = `autonomy-${n}`;
            return (
              <label
                key={n}
                htmlFor={id}
                className="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-muted"
              >
                <RadioGroupItem id={id} value={String(n)} className="mt-0.5" />
                <span className="text-sm">{AUTONOMY_SCORE_LABELS[n]}</span>
              </label>
            );
          })}
        </RadioGroup>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">개인 공부 가능 여부</h3>
        <RadioGroup
          value={studyPossibility ?? ""}
          onValueChange={(v) =>
            set("studyPossibility", v as typeof studyPossibility)
          }
          className="gap-2"
        >
          {Object.entries(STUDY_POSSIBILITY_LABELS).map(([value, label]) => {
            const id = `study-${value}`;
            return (
              <label
                key={value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted"
              >
                <RadioGroupItem id={id} value={value} />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
        </RadioGroup>
      </section>

      <StepFooter onBack={onBack} onNext={onNext} canProceed={canProceed} />
    </div>
  );
}
