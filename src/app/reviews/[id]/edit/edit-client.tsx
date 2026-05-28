"use client";

import { useEffect, useRef } from "react";
import { useReviewDraft, type ReviewDraft } from "@/app/reviews/new/store";
import { ReviewFormClient } from "@/app/reviews/new/form-client";

export type EditingReview = {
  id: string;
  workplaceId: string;
  workplaceName: string;
  workPeriodType: ReviewDraft["workPeriodType"];
  workYear: ReviewDraft["workYear"];
  workYearPublic: ReviewDraft["workYearPublic"];
  workTerm: ReviewDraft["workTerm"];
  workTermPublic: ReviewDraft["workTermPublic"];
  workDuration: ReviewDraft["workDuration"];
  incomeBracket: ReviewDraft["incomeBracket"];
  incomeBracketPublic: ReviewDraft["incomeBracketPublic"];
  tasks: ReviewDraft["tasks"];
  tasksOtherText: ReviewDraft["tasksOtherText"];
  autonomyScore: ReviewDraft["autonomyScore"];
  studyPossibility: ReviewDraft["studyPossibility"];
  workEnvironment: ReviewDraft["workEnvironment"];
  coworkerTypes: ReviewDraft["coworkerTypes"];
  recommendedFor: ReviewDraft["recommendedFor"];
  overallRating: ReviewDraft["overallRating"];
  freeText: ReviewDraft["freeText"];
};

export function EditClient({ review }: { review: EditingReview }) {
  const hydrate = useReviewDraft((s) => s.hydrate);
  const reset = useReviewDraft((s) => s.reset);
  const hydratedRef = useRef(false);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    hydrate({
      mode: "edit",
      editingReviewId: review.id,
      workplaceId: review.workplaceId,
      workplaceName: review.workplaceName,
      workPeriodType: review.workPeriodType,
      workYear: review.workYear,
      workYearPublic: review.workYearPublic,
      workTerm: review.workTerm,
      workTermPublic: review.workTermPublic,
      workDuration: review.workDuration,
      incomeBracket: review.incomeBracket,
      incomeBracketPublic: review.incomeBracketPublic,
      tasks: review.tasks,
      tasksOtherText: review.tasksOtherText,
      autonomyScore: review.autonomyScore,
      studyPossibility: review.studyPossibility,
      workEnvironment: review.workEnvironment,
      coworkerTypes: review.coworkerTypes,
      recommendedFor: review.recommendedFor,
      overallRating: review.overallRating,
      freeText: review.freeText,
    });
    return () => {
      reset();
    };
  }, [review, hydrate, reset]);

  return <ReviewFormClient initialStep={2} hideStep1 />;
}
