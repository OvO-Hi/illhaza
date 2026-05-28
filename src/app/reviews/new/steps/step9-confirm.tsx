"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useReviewDraft } from "../store";
import { StepFooter } from "./_footer";
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
} from "@/lib/labels";

type Props = {
  onBack: () => void;
  onSuccess: (reviewId?: string) => void;
  onEditStep: (step: number) => void;
};

export function Step9Confirm({ onBack, onSuccess, onEditStep }: Props) {
  const draft = useReviewDraft();
  const reset = useReviewDraft((s) => s.reset);
  const [submitting, setSubmitting] = useState(false);

  const canSubmit =
    !!draft.workplaceId &&
    !!draft.workPeriodType &&
    !!draft.workYear &&
    !!draft.workTerm &&
    !!draft.workDuration &&
    !!draft.incomeBracket &&
    draft.tasks.length > 0 &&
    !!draft.autonomyScore &&
    !!draft.studyPossibility &&
    !!draft.workEnvironment &&
    draft.coworkerTypes.length > 0 &&
    !!draft.overallRating &&
    draft.freeText.trim().length >= 5 &&
    (!draft.tasks.includes("OTHER") ||
      draft.tasksOtherText.trim().length >= 5);

  const isEdit = draft.mode === "edit";

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      const basePayload = {
        workPeriodType: draft.workPeriodType,
        workYear: draft.workYear,
        workYearPublic: draft.workYearPublic,
        workTerm: draft.workTerm,
        workTermPublic: draft.workTermPublic,
        workDuration: draft.workDuration,
        incomeBracket: draft.incomeBracket,
        incomeBracketPublic: draft.incomeBracketPublic,
        tasks: draft.tasks,
        tasksOtherText: draft.tasksOtherText || null,
        autonomyScore: draft.autonomyScore,
        studyPossibility: draft.studyPossibility,
        workEnvironment: draft.workEnvironment,
        coworkerTypes: draft.coworkerTypes,
        recommendedFor: draft.recommendedFor,
        overallRating: draft.overallRating,
        freeText: draft.freeText,
      };

      const url = isEdit
        ? `/api/reviews/${draft.editingReviewId}`
        : "/api/reviews";
      const method = isEdit ? "PATCH" : "POST";
      const payload = isEdit
        ? basePayload
        : { workplaceId: draft.workplaceId, ...basePayload };

      const res = await fetch(url, {
        method,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data: {
        ok?: boolean;
        review?: { id: string };
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? (isEdit ? "수정 실패" : "제출 실패"));
        return;
      }
      if (isEdit) {
        toast.success("수정되었어요");
      }
      const newId = data.review?.id ?? draft.editingReviewId ?? undefined;
      reset();
      onSuccess(newId ?? undefined);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">최종 확인</h2>
        <p className="text-sm text-muted-foreground">
          작성한 내용을 확인하고 제출해주세요. 항목 옆 수정을 눌러 되돌아갈 수
          있습니다.
        </p>
      </header>

      <Group title="근로지" step={1} onEdit={onEditStep}>
        <Field value={draft.workplaceName ?? "—"} />
      </Group>

      <Group title="근무 시기" step={2} onEdit={onEditStep}>
        <Field
          value={
            draft.workPeriodType
              ? WORK_PERIOD_TYPE_LABELS[draft.workPeriodType]
              : "—"
          }
        />
        <Field value={draft.workYear ? `${draft.workYear}년` : "—"} />
        <Field
          value={draft.workTerm ? WORK_TERM_LABELS[draft.workTerm] : "—"}
        />
        <Field
          value={
            draft.workDuration ? WORK_DURATION_LABELS[draft.workDuration] : "—"
          }
        />
      </Group>

      <Group title="분위" step={3} onEdit={onEditStep}>
        <p className="text-sm">
          {draft.incomeBracket ? INCOME_BRACKET_LABELS[draft.incomeBracket] : "—"}
          <span className="ml-2 text-xs text-muted-foreground">
            ({draft.incomeBracketPublic ? "공개" : "비공개"})
          </span>
        </p>
      </Group>

      <Group title="업무" step={4} onEdit={onEditStep}>
        <Field
          value={
            draft.tasks.length > 0
              ? draft.tasks
                  .map(
                    (t) =>
                      TASK_TYPE_LABELS[t as keyof typeof TASK_TYPE_LABELS] ?? t,
                  )
                  .join(", ")
              : "—"
          }
        />
        {draft.tasks.includes("OTHER") && draft.tasksOtherText.trim() && (
          <p className="mt-1 border-l-2 border-muted pl-3 text-sm text-muted-foreground">
            기타: {draft.tasksOtherText}
          </p>
        )}
      </Group>

      <Group title="자율도 & 공부" step={5} onEdit={onEditStep}>
        <Field
          value={
            draft.autonomyScore ? `자율도 ${draft.autonomyScore}점` : "—"
          }
        />
        <Field
          value={
            draft.studyPossibility
              ? `공부 ${STUDY_POSSIBILITY_LABELS[draft.studyPossibility]}`
              : "—"
          }
        />
      </Group>

      <Group title="근무 환경" step={6} onEdit={onEditStep}>
        <Field
          value={
            draft.workEnvironment
              ? WORK_ENVIRONMENT_LABELS[draft.workEnvironment]
              : "—"
          }
        />
        <Field
          value={
            draft.coworkerTypes.length > 0
              ? draft.coworkerTypes
                  .map(
                    (c) =>
                      COWORKER_TYPE_LABELS[
                        c as keyof typeof COWORKER_TYPE_LABELS
                      ] ?? c,
                  )
                  .join(", ")
              : "—"
          }
        />
      </Group>

      <Group title="추천" step={7} onEdit={onEditStep}>
        <Field
          value={
            draft.recommendedFor.length > 0
              ? draft.recommendedFor
                  .map(
                    (r) =>
                      RECOMMEND_TAG_LABELS[
                        r as keyof typeof RECOMMEND_TAG_LABELS
                      ] ?? r,
                  )
                  .join(", ")
              : "선택 안 함"
          }
        />
        <Field
          value={
            draft.overallRating
              ? `종합 추천도 ${draft.overallRating}점`
              : "—"
          }
        />
      </Group>

      <Group title="자유 작성" step={8} onEdit={onEditStep}>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">
          {draft.freeText || "—"}
        </p>
      </Group>

      <StepFooter
        onBack={onBack}
        onNext={handleSubmit}
        nextLabel={isEdit ? "수정 완료" : "후기 등록"}
        canProceed={canSubmit}
        submitting={submitting}
      />
    </div>
  );
}

function Group({
  title,
  step,
  onEdit,
  children,
}: {
  title: string;
  step: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-md border bg-card p-3">
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted-foreground">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="text-xs text-brand-700 underline"
        >
          수정
        </button>
      </div>
      <div className="space-y-1">{children}</div>
    </section>
  );
}

function Field({ value }: { value: string }) {
  return <p className="text-sm">{value}</p>;
}
