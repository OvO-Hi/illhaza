"use client";

import { useReviewDraft } from "../store";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { TASK_TYPE_LABELS } from "@/lib/labels";
import { StepFooter } from "./_footer";

const MIN_OTHER_LENGTH = 5;
const MAX_OTHER_LENGTH = 500;

export function Step4Tasks({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const tasks = useReviewDraft((s) => s.tasks);
  const tasksOtherText = useReviewDraft((s) => s.tasksOtherText);
  const toggle = useReviewDraft((s) => s.toggleArrayValue);
  const set = useReviewDraft((s) => s.set);

  const otherChecked = tasks.includes("OTHER");
  const otherTextLen = tasksOtherText.trim().length;
  const canProceed =
    tasks.length >= 1 && (!otherChecked || otherTextLen >= MIN_OTHER_LENGTH);

  const handleToggle = (value: string) => {
    const wasChecked = tasks.includes(value);
    toggle("tasks", value);
    // OTHER 체크 해제 시 부가 설명 초기화
    if (value === "OTHER" && wasChecked) {
      set("tasksOtherText", "");
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">어떤 업무를 하셨나요?</h2>
        <p className="text-sm text-muted-foreground">
          해당하는 업무를 모두 선택해주세요 (최소 1개).
        </p>
      </header>

      <div className="space-y-2">
        {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => {
          const id = `task-${value}`;
          const checked = tasks.includes(value);
          return (
            <label
              key={value}
              htmlFor={id}
              className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted"
            >
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => handleToggle(value)}
              />
              <span className="text-sm">{label}</span>
            </label>
          );
        })}
      </div>

      {otherChecked && (
        <div className="space-y-2 rounded-md border bg-muted/40 p-3">
          <Label htmlFor="tasks-other-text" className="font-medium">
            기타 업무 내용
          </Label>
          <Textarea
            id="tasks-other-text"
            value={tasksOtherText}
            onChange={(e) =>
              set("tasksOtherText", e.target.value.slice(0, MAX_OTHER_LENGTH))
            }
            placeholder="어떤 업무였는지 구체적으로 작성해주세요"
            rows={3}
            className="resize-none bg-background"
          />
          <div className="flex justify-between text-xs">
            <span
              className={
                otherTextLen < MIN_OTHER_LENGTH
                  ? "text-destructive"
                  : "text-muted-foreground"
              }
            >
              {otherTextLen < MIN_OTHER_LENGTH
                ? `${MIN_OTHER_LENGTH - otherTextLen}자 더 입력해주세요`
                : "✓ 충분히 입력하셨어요"}
            </span>
            <span className="text-muted-foreground">
              {tasksOtherText.length} / {MAX_OTHER_LENGTH}
            </span>
          </div>
        </div>
      )}

      <StepFooter onBack={onBack} onNext={onNext} canProceed={canProceed} />
    </div>
  );
}
