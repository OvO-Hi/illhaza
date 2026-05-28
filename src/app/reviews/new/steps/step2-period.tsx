"use client";

import { useReviewDraft } from "../store";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import {
  WORK_PERIOD_TYPE_LABELS,
  WORK_TERM_LABELS,
  WORK_DURATION_LABELS,
} from "@/lib/labels";
import { StepFooter } from "./_footer";

const START_YEAR = 2015;

export function Step2Period({
  onNext,
  onBack,
}: {
  onNext: () => void;
  onBack: () => void;
}) {
  const draft = useReviewDraft();
  const set = useReviewDraft((s) => s.set);

  const currentYear = new Date().getFullYear();
  // 2026, 2025, ..., 2015 — 최근 후기를 자주 작성하므로 최신 연도가 위에
  const years = Array.from(
    { length: currentYear - START_YEAR + 1 },
    (_, i) => currentYear - i,
  );

  const canProceed =
    !!draft.workPeriodType &&
    !!draft.workYear &&
    !!draft.workTerm &&
    !!draft.workDuration;

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h2 className="text-xl font-bold">언제 근로하셨나요?</h2>
        <p className="text-sm text-muted-foreground">
          근무 시기를 선택해주세요.
        </p>
      </header>

      <Section title="근로 형태">
        <RadioGroup
          value={draft.workPeriodType ?? ""}
          onValueChange={(v) =>
            set("workPeriodType", v as typeof draft.workPeriodType)
          }
          className="gap-2"
        >
          {Object.entries(WORK_PERIOD_TYPE_LABELS).map(([value, label]) => (
            <RadioRow key={value} value={value} label={label} groupId="period-type" />
          ))}
        </RadioGroup>
      </Section>

      <Section title="근로 연도">
        <select
          value={draft.workYear ?? ""}
          onChange={(e) =>
            set("workYear", e.target.value ? Number(e.target.value) : null)
          }
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
        >
          <option value="" disabled>
            연도 선택
          </option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}년
            </option>
          ))}
        </select>
        {draft.workYear !== null && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={!draft.workYearPublic}
              onCheckedChange={(v) => set("workYearPublic", v !== true)}
            />
            <span>연도 비공개 (어드민에게만 보임)</span>
          </label>
        )}
      </Section>

      <Section title="학기">
        <RadioGroup
          value={draft.workTerm ?? ""}
          onValueChange={(v) => set("workTerm", v as typeof draft.workTerm)}
          className="gap-2"
        >
          {Object.entries(WORK_TERM_LABELS).map(([value, label]) => (
            <RadioRow key={value} value={value} label={label} groupId="work-term" />
          ))}
        </RadioGroup>
        {draft.workTerm !== null && (
          <label className="flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
            <Checkbox
              checked={!draft.workTermPublic}
              onCheckedChange={(v) => set("workTermPublic", v !== true)}
            />
            <span>학기 비공개 (어드민에게만 보임)</span>
          </label>
        )}
      </Section>

      <Section title="기간">
        <RadioGroup
          value={draft.workDuration ?? ""}
          onValueChange={(v) =>
            set("workDuration", v as typeof draft.workDuration)
          }
          className="gap-2"
        >
          {Object.entries(WORK_DURATION_LABELS).map(([value, label]) => (
            <RadioRow
              key={value}
              value={value}
              label={label}
              groupId="work-duration"
            />
          ))}
        </RadioGroup>
      </Section>

      <StepFooter onBack={onBack} onNext={onNext} canProceed={canProceed} />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function RadioRow({
  value,
  label,
  groupId,
}: {
  value: string;
  label: string;
  groupId: string;
}) {
  const id = `${groupId}-${value}`;
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-center gap-3 rounded-md border p-3 hover:bg-muted"
    >
      <RadioGroupItem id={id} value={value} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
