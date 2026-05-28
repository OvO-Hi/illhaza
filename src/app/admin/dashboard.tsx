"use client";

import { useState } from "react";
import Link from "next/link";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { MobileHeader } from "@/components/MobileHeader";
import { EmptyState } from "@/components/EmptyState";

export type DeletionRequestItem = {
  id: string;
  targetType: "REVIEW" | "COMMENT";
  reason: string;
  createdAt: string;
  review: {
    id: string;
    excerpt: string;
    workplaceName: string;
    createdAt: string;
  } | null;
  comment: {
    id: string;
    content: string;
    reviewId: string;
    createdAt: string;
  } | null;
};

export function AdminDashboard({
  initialRequests,
}: {
  initialRequests: DeletionRequestItem[];
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [notesById, setNotesById] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handleDecision = async (
    id: string,
    decision: "APPROVED" | "REJECTED",
  ) => {
    if (processing) return;
    setProcessing(id);
    try {
      const adminNote = notesById[id]?.trim();
      const res = await fetch(`/api/admin/deletion-requests/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          decision,
          adminNote: adminNote || undefined,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "처리 실패");
        return;
      }
      toast.success(
        decision === "APPROVED" ? "삭제 승인 완료" : "요청 반려 완료",
      );
      setRequests((prev) => prev.filter((r) => r.id !== id));
      setNotesById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <main
      className="min-h-screen bg-muted/30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <MobileHeader title="어드민" backHref="/" backLabel="홈" />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <section>
          <h2 className="mb-3 text-lg font-bold">
            삭제 요청 ({requests.length})
          </h2>

          {requests.length === 0 ? (
            <Card className="py-2">
              <EmptyState icon={Inbox} title="처리할 요청이 없어요" />
            </Card>
          ) : (
            <div className="space-y-4">
              {requests.map((r) => (
                <Card key={r.id} className="space-y-3 p-4">
                  <div className="text-xs text-muted-foreground">
                    {r.targetType === "REVIEW" ? "후기" : "댓글"} ·{" "}
                    {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                  </div>

                  {r.review && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {r.review.workplaceName}
                      </p>
                      <p className="line-clamp-3 text-sm text-foreground/80">
                        {r.review.excerpt}
                      </p>
                      <Link
                        href={`/reviews/${r.review.id}`}
                        target="_blank"
                        className="text-xs text-brand-700 hover:underline"
                      >
                        후기 전체 보기 →
                      </Link>
                    </div>
                  )}

                  {r.comment && (
                    <div className="space-y-1">
                      <p className="line-clamp-3 text-sm text-foreground/80">
                        {r.comment.content}
                      </p>
                      <Link
                        href={`/reviews/${r.comment.reviewId}`}
                        target="_blank"
                        className="text-xs text-brand-700 hover:underline"
                      >
                        소속 후기 보기 →
                      </Link>
                    </div>
                  )}

                  <div className="rounded border-l-2 border-amber-400 bg-amber-50 p-3">
                    <p className="mb-1 text-xs font-semibold text-amber-800">
                      삭제 사유
                    </p>
                    <p className="text-sm text-amber-900">{r.reason}</p>
                  </div>

                  <Textarea
                    value={notesById[r.id] ?? ""}
                    onChange={(e) =>
                      setNotesById((prev) => ({
                        ...prev,
                        [r.id]: e.target.value.slice(0, 1000),
                      }))
                    }
                    placeholder="어드민 메모 (선택)"
                    rows={2}
                    className="resize-none"
                  />

                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={processing === r.id}
                      onClick={() => void handleDecision(r.id, "REJECTED")}
                    >
                      반려
                    </Button>
                    <Button
                      size="sm"
                      disabled={processing === r.id}
                      onClick={() => void handleDecision(r.id, "APPROVED")}
                      className="bg-red-600 text-white hover:bg-red-700"
                    >
                      {processing === r.id ? "처리 중..." : "삭제 승인"}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">캡쳐로 후기 등록</h2>
          <Card className="space-y-3 p-4">
            <p className="text-sm text-muted-foreground">
              게시판 캡쳐 이미지를 올리면 AI가 후기를 추출합니다. 한 이미지에
              여러 후기가 있어도 자동 분리됩니다.
            </p>
            <Link href="/admin/extract">
              <Button className="bg-brand text-white hover:bg-brand-700">
                캡쳐 업로드하러 가기
              </Button>
            </Link>
          </Card>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold">전체 후기 검색</h2>
          <Card className="py-8 text-center text-sm text-muted-foreground">
            준비 중입니다
          </Card>
        </section>
      </div>
    </main>
  );
}
