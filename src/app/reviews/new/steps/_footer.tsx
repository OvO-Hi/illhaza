"use client";

import { Button } from "@/components/ui/button";

type Props = {
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  canProceed: boolean;
  submitting?: boolean;
};

export function StepFooter({
  onBack,
  onNext,
  nextLabel = "다음",
  canProceed,
  submitting = false,
}: Props) {
  return (
    <div className="flex gap-2 pt-4">
      {onBack && (
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          뒤로
        </Button>
      )}
      {onNext && (
        <Button
          type="button"
          onClick={onNext}
          disabled={!canProceed || submitting}
          className="flex-1 bg-brand text-white hover:bg-brand-700"
        >
          {submitting ? "..." : nextLabel}
        </Button>
      )}
    </div>
  );
}
