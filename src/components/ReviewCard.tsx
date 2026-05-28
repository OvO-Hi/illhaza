import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  INCOME_BRACKET_LABELS,
  WORK_PERIOD_TYPE_LABELS,
  WORK_TERM_LABELS,
} from "@/lib/labels";

export type ReviewCardData = {
  id: string;
  workPeriodType: "SEMESTER" | "INTENSIVE" | "BOTH" | null;
  workYear: number | null;
  workTerm: "SPRING" | "FALL" | "SUMMER" | "WINTER" | null;
  incomeBracket: "LOW" | "MID" | "HIGH" | null;
  autonomyScore: number | null;
  overallRating: number | null;
  commentCount: number;
  excerpt: string;
  isEdited?: boolean;
};

export function ReviewCard({ review }: { review: ReviewCardData }) {
  return (
    <Link
      href={`/reviews/${review.id}`}
      className="block rounded-lg border bg-card p-4 transition active:bg-muted hover:border-brand-400 hover:bg-muted/40"
    >
      <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {review.workYear && review.workTerm && (
          <span>
            {review.workYear}년 {WORK_TERM_LABELS[review.workTerm]}
          </span>
        )}
        {review.workPeriodType && (
          <>
            <span>·</span>
            <span>{WORK_PERIOD_TYPE_LABELS[review.workPeriodType]}</span>
          </>
        )}
        {review.isEdited && (
          <>
            <span>·</span>
            <span>수정됨</span>
          </>
        )}
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        {review.incomeBracket && (
          <Badge variant="secondary" className="text-xs">
            {INCOME_BRACKET_LABELS[review.incomeBracket]}
          </Badge>
        )}
        {review.autonomyScore && (
          <span className="text-xs text-foreground/70">
            자율도 {"●".repeat(review.autonomyScore)}
            {"○".repeat(5 - review.autonomyScore)}
          </span>
        )}
        {review.overallRating && (
          <span className="text-xs text-amber-600">
            {"★".repeat(review.overallRating)}
            {"☆".repeat(5 - review.overallRating)}
          </span>
        )}
      </div>

      {review.excerpt && (
        <p className="line-clamp-2 text-sm text-foreground/80">
          {review.excerpt}
        </p>
      )}

      {review.commentCount > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          💬 {review.commentCount}
        </div>
      )}
    </Link>
  );
}
