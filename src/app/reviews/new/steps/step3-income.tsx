"use client";

import { useReviewDraft } from "../store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { INCOME_BRACKET_LABELS } from "@/lib/labels";
import { StepFooter } from "./_footer";

export function Step3Income({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const incomeBracket = useReviewDraft((s) => s.incomeBracket);
  const incomeBracketPublic = useReviewDraft((s) => s.incomeBracketPublic);
  const set = useReviewDraft((s) => s.set);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">합격 당시 분위는 어땠나요?</h2>
        <p className="text-sm text-muted-foreground">
          익명 보호를 위해 1~10분위를 3구간으로 묶었습니다. 공개 여부는 아래에서
          따로 설정할 수 있어요.
        </p>
      </header>

      <RadioGroup
        value={incomeBracket ?? ""}
        onValueChange={(v) => set("incomeBracket", v as typeof incomeBracket)}
        className="gap-2"
      >
        {Object.entries(INCOME_BRACKET_LABELS).map(([value, label]) => {
          const id = `income-${value}`;
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

      <div className="flex items-center justify-between rounded-md border p-3">
        <div className="space-y-0.5">
          <Label
            htmlFor="income-public-toggle"
            className="cursor-pointer font-medium"
          >
            리뷰에 공개
          </Label>
          <p className="text-xs text-muted-foreground">
            {incomeBracketPublic
              ? "분위 정보가 다른 사용자에게 공개됩니다"
              : "분위 정보가 다른 사용자에게 표시되지 않습니다"}
          </p>
        </div>
        <Switch
          id="income-public-toggle"
          checked={incomeBracketPublic}
          onCheckedChange={(v) => set("incomeBracketPublic", v)}
        />
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        canProceed={incomeBracket !== null}
      />
    </div>
  );
}
