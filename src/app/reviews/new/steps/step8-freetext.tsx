"use client";

import { useReviewDraft } from "../store";
import { Textarea } from "@/components/ui/textarea";
import { StepFooter } from "./_footer";

const MIN_LEN = 5;
const MAX_LEN = 5000;

export function Step8FreeText({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const freeText = useReviewDraft((s) => s.freeText);
  const set = useReviewDraft((s) => s.set);

  const trimmedLen = freeText.trim().length;
  const canProceed = trimmedLen >= MIN_LEN;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">자유롭게 작성해주세요</h2>
        <p className="text-sm text-muted-foreground">
          근무 환경, 분위기, 특이사항 등 다른 사람에게 도움이 될 만한 내용을
          남겨주세요.
        </p>
      </header>

      <div className="space-y-1">
        <Textarea
          value={freeText}
          onChange={(e) => set("freeText", e.target.value.slice(0, MAX_LEN))}
          placeholder="최소 5자 이상 자유롭게 작성해주세요"
          rows={10}
          className="resize-none"
        />
        <div className="flex justify-between text-xs">
          <span
            className={
              trimmedLen < MIN_LEN ? "text-destructive" : "text-muted-foreground"
            }
          >
            {trimmedLen < MIN_LEN
              ? `${MIN_LEN - trimmedLen}자 더 입력해주세요`
              : "✓ 충분히 입력하셨어요"}
          </span>
          <span className="text-muted-foreground">
            {freeText.length} / {MAX_LEN}
          </span>
        </div>
      </div>

      <StepFooter
        onBack={onBack}
        onNext={onNext}
        canProceed={canProceed}
      />
    </div>
  );
}
