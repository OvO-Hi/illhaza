"use client";

import { useReviewDraft } from "../store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  WORK_ENVIRONMENT_LABELS,
  COWORKER_TYPE_LABELS,
} from "@/lib/labels";
import { StepFooter } from "./_footer";

export function Step6Environment({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const workEnvironment = useReviewDraft((s) => s.workEnvironment);
  const coworkerTypes = useReviewDraft((s) => s.coworkerTypes);
  const set = useReviewDraft((s) => s.set);
  const toggle = useReviewDraft((s) => s.toggleArrayValue);

  const canProceed = !!workEnvironment && coworkerTypes.length > 0;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">근무 환경은 어땠나요?</h2>
        <p className="text-sm text-muted-foreground">
          공간 구성과 함께 일한 사람을 알려주세요.
        </p>
      </header>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">근무 공간</h3>
        <RadioGroup
          value={workEnvironment ?? ""}
          onValueChange={(v) =>
            set("workEnvironment", v as typeof workEnvironment)
          }
          className="gap-2"
        >
          {Object.entries(WORK_ENVIRONMENT_LABELS).map(([value, label]) => {
            const id = `env-${value}`;
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

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">함께 일한 사람 (다중 선택)</h3>
        <div className="space-y-2">
          {Object.entries(COWORKER_TYPE_LABELS).map(([value, label]) => {
            const id = `coworker-${value}`;
            const checked = coworkerTypes.includes(value);
            return (
              <label
                key={value}
                htmlFor={id}
                className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted"
              >
                <Checkbox
                  id={id}
                  checked={checked}
                  onCheckedChange={() => toggle("coworkerTypes", value)}
                />
                <span className="text-sm">{label}</span>
              </label>
            );
          })}
        </div>
      </section>

      <StepFooter onBack={onBack} onNext={onNext} canProceed={canProceed} />
    </div>
  );
}
