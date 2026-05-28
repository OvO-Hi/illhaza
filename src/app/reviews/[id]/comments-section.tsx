"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
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
import { EmptyState } from "@/components/EmptyState";

export type CommentItem = {
  id: string;
  content: string;
  createdAt: string;
  authorNickname: string;
  isOwner: boolean;
  status: "PUBLISHED" | "PENDING_DELETION" | "DELETED";
};

const MAX_LEN = 2000;

export function CommentsSection({
  reviewId,
  initialComments,
  canComment,
}: {
  reviewId: string;
  initialComments: CommentItem[];
  canComment: boolean;
}) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [editing, setEditing] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = draft.trim();
    if (!trimmed || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/reviews/${reviewId}/comments`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data: {
        comment?: CommentItem;
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.comment) {
        toast.error(data.error ?? "댓글 등록 실패");
        return;
      }
      setComments((prev) => [...prev, data.comment!]);
      setDraft("");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setPosting(false);
    }
  };

  const startEdit = (c: CommentItem) => {
    setEditingId(c.id);
    setEditDraft(c.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft("");
  };

  const handleEdit = async (commentId: string) => {
    const trimmed = editDraft.trim();
    if (!trimmed || editing) return;
    setEditing(true);
    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });
      const data: {
        comment?: { content: string };
        error?: string;
      } = await res.json().catch(() => ({}));
      if (!res.ok || !data.comment) {
        toast.error(data.error ?? "수정 실패");
        return;
      }
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, content: data.comment!.content } : c,
        ),
      );
      setEditingId(null);
      setEditDraft("");
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setEditing(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/comments/${deletingId}`, {
        method: "DELETE",
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "삭제 실패");
        return;
      }
      // 일반 사용자 시점에서는 목록에서 즉시 제거
      setComments((prev) => prev.filter((c) => c.id !== deletingId));
      toast.success("댓글을 삭제했어요");
      setDeletingId(null);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <section className="mt-8 border-t pt-6">
      <h3 className="mb-4 text-base font-bold">댓글 {comments.length}</h3>

      <div className="mb-6 space-y-3">
        {comments.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="첫 댓글을 남겨보세요"
          />
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-lg border p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">{c.authorNickname}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>

              {editingId === c.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editDraft}
                    onChange={(e) =>
                      setEditDraft(e.target.value.slice(0, MAX_LEN))
                    }
                    rows={3}
                    className="resize-none"
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={cancelEdit}
                      disabled={editing}
                    >
                      취소
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => void handleEdit(c.id)}
                      disabled={!editDraft.trim() || editing}
                      className="bg-brand text-white hover:bg-brand-700"
                    >
                      {editing ? "저장 중..." : "저장"}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm">{c.content}</p>
                  {c.status === "DELETED" && (
                    <p className="mt-2 text-xs text-muted-foreground">삭제됨</p>
                  )}
                  {c.isOwner && c.status === "PUBLISHED" && (
                    <div className="mt-2 flex gap-3 text-xs">
                      <button
                        type="button"
                        onClick={() => startEdit(c)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingId(c.id)}
                        className="text-muted-foreground hover:text-red-600"
                      >
                        삭제
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {canComment ? (
        <div className="space-y-2">
          <Textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
            placeholder="댓글을 작성해주세요"
            rows={3}
            className="resize-none"
          />
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {draft.length} / {MAX_LEN}
            </span>
            <Button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={posting || draft.trim().length === 0}
              className="bg-brand text-white hover:bg-brand-700"
            >
              {posting ? "등록 중..." : "댓글 등록"}
            </Button>
          </div>
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-muted-foreground">
          이 후기에는 댓글을 작성할 수 없습니다
        </p>
      )}

      <Dialog
        open={deletingId !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>댓글을 삭제할까요?</DialogTitle>
            <DialogDescription>
              삭제한 댓글은 다른 사람에게 더 이상 보이지 않습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingId(null)}
              disabled={deleting}
            >
              취소
            </Button>
            <Button
              onClick={() => void handleDelete()}
              disabled={deleting}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleting ? "삭제 중..." : "삭제"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
