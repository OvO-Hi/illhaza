"use client";

import { create } from "zustand";

export type ReviewDraft = {
  mode: "create" | "edit";
  editingReviewId: string | null;

  workplaceId: string | null;
  workplaceName: string | null;

  workPeriodType: "SEMESTER" | "INTENSIVE" | "BOTH" | null;
  workYear: number | null;
  workYearPublic: boolean;
  workTerm: "SPRING" | "FALL" | "SUMMER" | "WINTER" | null;
  workTermPublic: boolean;
  workDuration: "ONE_SEMESTER" | "TWO_SEMESTERS" | "YEAR_PLUS" | null;

  incomeBracket: "LOW" | "MID" | "HIGH" | null;
  incomeBracketPublic: boolean;

  tasks: string[];
  tasksOtherText: string;

  autonomyScore: number | null;
  studyPossibility: "POSSIBLE" | "LIMITED" | "IMPOSSIBLE" | null;

  workEnvironment: "ALONE" | "WITH_PEERS" | "WITH_STAFF" | null;
  coworkerTypes: string[];

  recommendedFor: string[];
  overallRating: number | null;

  freeText: string;
};

type ArrayKey = "tasks" | "coworkerTypes" | "recommendedFor";

type Actions = {
  set: <K extends keyof ReviewDraft>(key: K, value: ReviewDraft[K]) => void;
  toggleArrayValue: (key: ArrayKey, value: string) => void;
  hydrate: (data: Partial<ReviewDraft>) => void;
  reset: () => void;
};

const initial: ReviewDraft = {
  mode: "create",
  editingReviewId: null,
  workplaceId: null,
  workplaceName: null,
  workPeriodType: null,
  workYear: null,
  workYearPublic: true,
  workTerm: null,
  workTermPublic: true,
  workDuration: null,
  incomeBracket: null,
  incomeBracketPublic: true,
  tasks: [],
  tasksOtherText: "",
  autonomyScore: null,
  studyPossibility: null,
  workEnvironment: null,
  coworkerTypes: [],
  recommendedFor: [],
  overallRating: null,
  freeText: "",
};

export const useReviewDraft = create<ReviewDraft & Actions>((set) => ({
  ...initial,
  set: (key, value) => set({ [key]: value } as Partial<ReviewDraft>),
  toggleArrayValue: (key, value) =>
    set((state) => {
      const arr = state[key];
      return {
        [key]: arr.includes(value)
          ? arr.filter((v) => v !== value)
          : [...arr, value],
      } as Partial<ReviewDraft>;
    }),
  hydrate: (data) => set((state) => ({ ...state, ...data })),
  reset: () => set(initial),
}));
