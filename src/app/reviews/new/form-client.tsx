"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useReviewDraft } from "./store";
import { Step1Workplace } from "./steps/step1-workplace";
import { Step2Period } from "./steps/step2-period";
import { Step3Income } from "./steps/step3-income";
import { Step4Tasks } from "./steps/step4-tasks";
import { Step5Autonomy } from "./steps/step5-autonomy";
import { Step6Environment } from "./steps/step6-environment";
import { Step7Recommend } from "./steps/step7-recommend";
import { Step8FreeText } from "./steps/step8-freetext";
import { Step9Confirm } from "./steps/step9-confirm";

const TOTAL_STEPS = 9;

export function ReviewFormClient({
  initialWorkplace = null,
  initialStep,
  hideStep1 = false,
}: {
  initialWorkplace?: { id: string; name: string } | null;
  initialStep?: number;
  hideStep1?: boolean;
}) {
  const router = useRouter();
  const setDraft = useReviewDraft((s) => s.set);
  const editingReviewId = useReviewDraft((s) => s.editingReviewId);
  const computedInitialStep =
    initialStep ?? (initialWorkplace ? 2 : 1);
  const [step, setStep] = useState(computedInitialStep);
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (prefilledRef.current) return;
    prefilledRef.current = true;
    if (initialWorkplace) {
      setDraft("workplaceId", initialWorkplace.id);
      setDraft("workplaceName", initialWorkplace.name);
    }
  }, [initialWorkplace, setDraft]);

  const minStep = hideStep1 ? 2 : 1;
  const goTo = (n: number) =>
    setStep(Math.min(Math.max(n, minStep), TOTAL_STEPS));

  // hideStep1 모드에서 step2의 "뒤로" → 페이지 자체에서 이탈
  const goBackFromFirst = () => {
    if (hideStep1 && editingReviewId) {
      router.push(`/reviews/${editingReviewId}`);
    } else {
      router.push("/");
    }
  };

  // 진행 바 표시: hideStep1이면 8단계 표시
  const displayTotal = hideStep1 ? TOTAL_STEPS - 1 : TOTAL_STEPS;
  const displayCurrent = hideStep1 ? step - 1 : step;
  const progressWidth = (displayCurrent / displayTotal) * 100;

  const stepNodes: Record<number, ReactNode> = {
    1: <Step1Workplace onNext={() => goTo(2)} />,
    2: (
      <Step2Period
        onNext={() => goTo(3)}
        onBack={hideStep1 ? goBackFromFirst : () => goTo(1)}
      />
    ),
    3: <Step3Income onNext={() => goTo(4)} onBack={() => goTo(2)} />,
    4: <Step4Tasks onNext={() => goTo(5)} onBack={() => goTo(3)} />,
    5: <Step5Autonomy onNext={() => goTo(6)} onBack={() => goTo(4)} />,
    6: <Step6Environment onNext={() => goTo(7)} onBack={() => goTo(5)} />,
    7: <Step7Recommend onNext={() => goTo(8)} onBack={() => goTo(6)} />,
    8: <Step8FreeText onNext={() => goTo(9)} onBack={() => goTo(7)} />,
    9: (
      <Step9Confirm
        onBack={() => goTo(8)}
        onSuccess={(reviewId) => {
          if (hideStep1 && reviewId) {
            router.push(`/reviews/${reviewId}`);
          } else {
            router.push("/reviews/new/done");
          }
        }}
        onEditStep={(s) => goTo(s)}
      />
    ),
  };

  return (
    <main
      className="min-h-screen bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <header
        className="sticky top-0 z-10 border-b bg-white px-4 py-3"
        style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
      >
        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={() => {
              if (hideStep1 && editingReviewId) {
                router.push(`/reviews/${editingReviewId}`);
              } else {
                router.push("/");
              }
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            취소
          </button>
          <span className="font-medium text-foreground">
            {displayCurrent} / {displayTotal}
          </span>
          <div className="w-10" />
        </div>
        <div className="mt-2 h-1 rounded bg-muted">
          <div
            className="h-1 rounded bg-brand transition-all"
            style={{ width: `${progressWidth}%` }}
          />
        </div>
      </header>

      <div className="px-4 py-6">{stepNodes[step]}</div>
    </main>
  );
}
