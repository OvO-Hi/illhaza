"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileHeader } from "@/components/MobileHeader";
import { CommentsSection, type CommentItem } from "./comments-section";
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

export type ReviewDetailData = {
  id: string;
  workplace: {
    id: string;
    name: string;
    department: string | null;
    district: string;
  };
  workPeriodType: "SEMESTER" | "INTENSIVE" | "BOTH" | null;
  workYear: number | null;
  workYearPublic: boolean;
  workTerm: "SPRING" | "FALL" | "SUMMER" | "WINTER" | null;
  workTermPublic: boolean;
  workDuration: "ONE_SEMESTER" | "TWO_SEMESTERS" | "YEAR_PLUS" | null;
  incomeBracket: "LOW" | "MID" | "HIGH" | null;
  incomeBracketPublic: boolean;
  tasks: string[];
  tasksOtherText: string | null;
  autonomyScore: number | null;
  studyPossibility: "POSSIBLE" | "LIMITED" | "IMPOSSIBLE" | null;
  workEnvironment: "ALONE" | "WITH_PEERS" | "WITH_STAFF" | null;
  coworkerTypes: string[];
  recommendedFor: string[];
  overallRating: number | null;
  freeText: string | null;
  status: "PUBLISHED" | "PENDING_DELETION" | "DELETED";
  createdAt: string;
  updatedAt: string;
};

export function ReviewDetailClient({
  review,
  authorNickname,
  isOwner,
  isAdmin,
  initialComments,
  canComment,
}: {
  review: ReviewDetailData;
  authorNickname: string;
  isOwner: boolean;
  isAdmin: boolean;
  initialComments: CommentItem[];
  canComment: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [submittingDelete, setSubmittingDelete] = useState(false);
  const [adminDeleteOpen, setAdminDeleteOpen] = useState(false);
  const [adminDeleteReason, setAdminDeleteReason] = useState("");
  const [adminDeleting, setAdminDeleting] = useState(false);

  const submitReviewDeletion = async () => {
    const trimmed = deleteReason.trim();
    if (trimmed.length < 5) {
      toast.error("삭제 사유를 5자 이상 작성해주세요");
      return;
    }
    if (submittingDelete) return;
    setSubmittingDelete(true);
    try {
      const res = await fetch("/api/deletion-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          targetType: "REVIEW",
          targetId: review.id,
          reason: trimmed,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "삭제 요청 실패");
        return;
      }
      toast.success("삭제 요청이 접수되었어요. 어드민 검토 후 처리됩니다");
      setDeleteOpen(false);
      setDeleteReason("");
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmittingDelete(false);
    }
  };

  const handleAdminDelete = async () => {
    if (adminDeleteReason.trim().length < 5) {
      toast.error("삭제 사유를 5자 이상 작성해주세요");
      return;
    }
    if (adminDeleting) return;
    setAdminDeleting(true);
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ reason: adminDeleteReason.trim() }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "삭제 실패");
        return;
      }
      toast.success("삭제되었어요");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setAdminDeleting(false);
    }
  };

  const isEdited =
    new Date(review.updatedAt).getTime() -
      new Date(review.createdAt).getTime() >
    60 * 1000;

  const periodLine = [
    review.workYear ? `${review.workYear}년` : null,
    review.workTerm ? WORK_TERM_LABELS[review.workTerm] : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <main
      className="min-h-screen bg-background pb-12"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <MobileHeader
        title={
          review.workplace.department
            ? `${review.workplace.name} — ${review.workplace.department}`
            : review.workplace.name
        }
        backHref={`/workplaces/${review.workplace.id}`}
        backLabel="근로지"
      />

      <section className="space-y-4 px-4 py-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">
              {authorNickname}
            </span>
            {periodLine && <span> · {periodLine}</span>}
            {isEdited && (
              <span className="ml-2 text-xs">· 수정됨</span>
            )}
          </p>
        </div>

        {review.status === "PENDING_DELETION" && isOwner && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            삭제 요청이 접수되었어요. 어드민 검토 중입니다.
          </div>
        )}
        {review.status === "PENDING_DELETION" && !isOwner && isAdmin && (
          <Badge variant="secondary" className="bg-amber-100 text-amber-900">
            삭제 요청 중 (어드민 보기)
          </Badge>
        )}
        {review.status === "DELETED" && isAdmin && (
          <Badge variant="secondary" className="bg-red-100 text-red-900">
            삭제됨 (어드민 보기)
          </Badge>
        )}

        <Section title="근무 시기">
          {(() => {
            const canSeeYear =
              review.workYearPublic || isAdmin || isOwner;
            const canSeeTerm =
              review.workTermPublic || isAdmin || isOwner;
            const yearText =
              review.workYear !== null
                ? canSeeYear
                  ? `${review.workYear}년`
                  : "비공개"
                : null;
            const termText =
              review.workTerm
                ? canSeeTerm
                  ? WORK_TERM_LABELS[review.workTerm]
                  : "비공개"
                : null;
            const parts = [
              review.workPeriodType
                ? WORK_PERIOD_TYPE_LABELS[review.workPeriodType]
                : null,
              yearText && termText ? `${yearText} ${termText}` : yearText ?? termText,
              review.workDuration
                ? WORK_DURATION_LABELS[review.workDuration]
                : null,
            ].filter(Boolean);
            return (
              <p className="text-sm">
                {parts.length > 0 ? parts.join(" · ") : "—"}
                {isAdmin &&
                  (!review.workYearPublic || !review.workTermPublic) && (
                    <span className="ml-2 text-xs text-amber-700">
                      (어드민 보기 — 비공개 항목 포함)
                    </span>
                  )}
              </p>
            );
          })()}
        </Section>

        <Section title="분위">
          <p className="text-sm">
            {review.incomeBracket
              ? INCOME_BRACKET_LABELS[review.incomeBracket]
              : "비공개"}
            {isAdmin && !review.incomeBracketPublic && (
              <span className="ml-2 text-xs text-muted-foreground">
                (어드민 보기 — 비공개 후기)
              </span>
            )}
          </p>
        </Section>

        <Section title="업무">
          <div className="flex flex-wrap gap-1.5">
            {review.tasks.length === 0 ? (
              <span className="text-sm text-muted-foreground">—</span>
            ) : (
              review.tasks.map((t) => (
                <Badge key={t} variant="outline">
                  {TASK_TYPE_LABELS[t as keyof typeof TASK_TYPE_LABELS] ?? t}
                </Badge>
              ))
            )}
          </div>
          {review.tasks.includes("OTHER") && review.tasksOtherText && (
            <p className="mt-2 border-l-2 border-muted pl-3 text-sm text-foreground/80">
              {review.tasksOtherText}
            </p>
          )}
        </Section>

        <Section title="자율도 & 공부">
          <div className="space-y-1 text-sm">
            <p>
              자율도:{" "}
              <span className="font-mono text-foreground/80">
                {review.autonomyScore
                  ? "●".repeat(review.autonomyScore) +
                    "○".repeat(5 - review.autonomyScore)
                  : "—"}
              </span>{" "}
              {review.autonomyScore && `(${review.autonomyScore}점)`}
            </p>
            <p>
              개인 공부:{" "}
              {review.studyPossibility
                ? STUDY_POSSIBILITY_LABELS[review.studyPossibility]
                : "—"}
            </p>
          </div>
        </Section>

        <Section title="근무 환경">
          <div className="space-y-2 text-sm">
            <p>
              공간:{" "}
              {review.workEnvironment
                ? WORK_ENVIRONMENT_LABELS[review.workEnvironment]
                : "—"}
            </p>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-foreground/80">함께 일한 사람:</span>
              {review.coworkerTypes.length === 0 ? (
                <span className="text-muted-foreground">—</span>
              ) : (
                review.coworkerTypes.map((c) => (
                  <Badge key={c} variant="outline">
                    {COWORKER_TYPE_LABELS[
                      c as keyof typeof COWORKER_TYPE_LABELS
                    ] ?? c}
                  </Badge>
                ))
              )}
            </div>
          </div>
        </Section>

        {review.recommendedFor.length > 0 && (
          <Section title="추천 대상">
            <div className="flex flex-wrap gap-1.5">
              {review.recommendedFor.map((r) => (
                <Badge key={r} variant="secondary">
                  {RECOMMEND_TAG_LABELS[
                    r as keyof typeof RECOMMEND_TAG_LABELS
                  ] ?? r}
                </Badge>
              ))}
            </div>
          </Section>
        )}

        <Section title="종합 추천도">
          <p className="text-base text-amber-600">
            {review.overallRating
              ? "★".repeat(review.overallRating) +
                "☆".repeat(5 - review.overallRating)
              : "—"}{" "}
            {review.overallRating && (
              <span className="ml-1 text-xs text-foreground/60">
                ({review.overallRating}점)
              </span>
            )}
          </p>
        </Section>

        {review.freeText && (
          <Section title="자유 작성">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {review.freeText}
            </p>
          </Section>
        )}

        {(isOwner || isAdmin) && (
          <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground">
              {isOwner ? "내 글 액션" : "어드민 액션"}
            </p>
            <div className="flex flex-wrap gap-2">
              {isOwner && review.status === "PUBLISHED" && (
                <Link href={`/reviews/${review.id}/edit`}>
                  <Button size="sm" variant="outline">
                    수정
                  </Button>
                </Link>
              )}
              {isOwner && (
                <>
                  {review.status === "PUBLISHED" && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => {
                        setDeleteOpen(true);
                        setDeleteReason("");
                      }}
                    >
                      삭제 요청
                    </Button>
                  )}
                </>
              )}
              {isAdmin && review.status !== "DELETED" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => {
                    setAdminDeleteReason("");
                    setAdminDeleteOpen(true);
                  }}
                >
                  어드민 삭제
                </Button>
              )}
            </div>
          </div>
        )}

        <CommentsSection
          reviewId={review.id}
          initialComments={initialComments}
          canComment={canComment}
        />
      </section>

      <Dialog
        open={deleteOpen}
        onOpenChange={(open) => {
          setDeleteOpen(open);
          if (!open) setDeleteReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>후기 삭제 요청</DialogTitle>
            <DialogDescription>
              어드민 검토 후 처리됩니다. 삭제 사유를 5자 이상 작성해주세요.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value.slice(0, 1000))}
            placeholder="삭제 사유"
            rows={4}
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground">
            {deleteReason.length} / 1000
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteOpen(false);
                setDeleteReason("");
              }}
            >
              취소
            </Button>
            <Button
              onClick={() => void submitReviewDeletion()}
              disabled={
                submittingDelete || deleteReason.trim().length < 5
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {submittingDelete ? "요청 중..." : "삭제 요청"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={adminDeleteOpen}
        onOpenChange={(open) => {
          setAdminDeleteOpen(open);
          if (!open) setAdminDeleteReason("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>어드민 권한으로 삭제하시겠어요?</DialogTitle>
            <DialogDescription>
              삭제 사유를 5자 이상 작성해주세요. 진행 중인 사용자 요청이 있으면
              함께 승인 처리됩니다.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={adminDeleteReason}
            onChange={(e) =>
              setAdminDeleteReason(e.target.value.slice(0, 1000))
            }
            placeholder="삭제 사유"
            rows={3}
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground">
            {adminDeleteReason.length} / 1000
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdminDeleteOpen(false)}
              disabled={adminDeleting}
            >
              취소
            </Button>
            <Button
              onClick={() => void handleAdminDelete()}
              disabled={
                adminDeleting || adminDeleteReason.trim().length < 5
              }
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {adminDeleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
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
    <section className="space-y-1">
      <h2 className="text-xs font-semibold text-muted-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
