"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WorkplaceMap } from "@/components/WorkplaceMap";
import { ReviewCard, type ReviewCardData } from "@/components/ReviewCard";
import { MobileHeader } from "@/components/MobileHeader";
import { EmptyState } from "@/components/EmptyState";
import { formatTransitMinutes } from "@/lib/labels";

type WorkplaceInfo = {
  id: string;
  name: string;
  department: string | null;
  address: string;
  district: string;
  category: "ON_CAMPUS" | "OFF_CAMPUS";
  latitude: number;
  longitude: number;
  transitMinFromMainGate: number | null;
  transitMinFromBackGate: number | null;
};

export type ReviewCardItem = ReviewCardData;

export function WorkplaceDetailClient({
  workplace,
  reviews,
  avgRating,
  isAdmin = false,
}: {
  workplace: WorkplaceInfo;
  reviews: ReviewCardItem[];
  avgRating: number | null;
  isAdmin?: boolean;
}) {
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/workplaces/${workplace.id}`, {
        method: "DELETE",
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "삭제 실패");
        return;
      }
      toast.success("근로지가 삭제되었어요");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-28">
      <MobileHeader
        title={
          workplace.department
            ? `${workplace.name} — ${workplace.department}`
            : workplace.name
        }
        backHref="/"
        backLabel="홈"
      />

      <section className="space-y-3 px-4 py-4">
        <div className="space-y-2 rounded-lg border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              className={
                workplace.category === "ON_CAMPUS"
                  ? "bg-brand text-white hover:bg-brand-700"
                  : ""
              }
              variant={
                workplace.category === "ON_CAMPUS" ? "default" : "secondary"
              }
            >
              {workplace.category === "ON_CAMPUS" ? "학내" : "학외"}
            </Badge>
            <Badge variant="outline">{workplace.district}</Badge>
          </div>
          <p className="text-sm text-foreground/80">{workplace.address}</p>

          {workplace.category === "OFF_CAMPUS" && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {workplace.transitMinFromMainGate !== null && (
                <span>
                  정문에서{" "}
                  {formatTransitMinutes(workplace.transitMinFromMainGate)}
                </span>
              )}
              {workplace.transitMinFromBackGate !== null && (
                <span>
                  후문에서{" "}
                  {formatTransitMinutes(workplace.transitMinFromBackGate)}
                </span>
              )}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              후기 {reviews.length}개
            </span>
            {avgRating !== null && (
              <span className="text-amber-600">
                ★ {avgRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        <WorkplaceMap
          latitude={workplace.latitude}
          longitude={workplace.longitude}
          height={200}
        />

        {isAdmin && (
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => setDeleteOpen(true)}
            >
              어드민: 근로지 삭제
            </Button>
          </div>
        )}
      </section>

      <section className="space-y-2 px-4 pb-4">
        <h2 className="text-sm font-semibold">후기 {reviews.length}개</h2>
        {reviews.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="아직 등록된 후기가 없어요"
            description="첫 후기를 남겨보세요"
          />
        ) : (
          <div className="space-y-2">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>
        )}
      </section>

      <Link
        href={`/reviews/new?workplaceId=${workplace.id}`}
        className="fixed right-4 z-20 flex items-center gap-2 rounded-full bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-brand-700"
        style={{
          bottom: "calc(env(safe-area-inset-bottom) + 16px)",
        }}
      >
        <Plus className="h-4 w-4" />
        이 근로지에 후기 작성
      </Link>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>근로지를 삭제할까요?</DialogTitle>
            <DialogDescription>
              이 근로지를 영구 삭제합니다. 후기가 1개라도 있으면 삭제할 수
              없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
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
    </main>
  );
}
