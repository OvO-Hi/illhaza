"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { MobileHeader } from "@/components/MobileHeader";
import type { ExtractedReview } from "@/lib/claude";
import { ExtractedCardEditor } from "./extracted-card-editor";
import { UploadSection } from "./upload-section";

export type ExtractedCard = {
  id: string;
  extracted: ExtractedReview;
  workplaceId: string | null;
  workplaceLabel: string | null;
  saved: boolean;
};

export function ExtractClient() {
  const [cards, setCards] = useState<ExtractedCard[]>([]);

  const handleExtractedReviews = (reviews: ExtractedReview[]) => {
    setCards((prev) => [
      ...prev,
      ...reviews.map((r, i) => ({
        id: `card-${Date.now()}-${i}-${Math.random()}`,
        extracted: r,
        workplaceId: null,
        workplaceLabel: null,
        saved: false,
      })),
    ]);
    toast.success(`${reviews.length}개 후기 추출됨`);
  };

  const handleMatched = (
    cardId: string,
    workplaceId: string,
    workplaceLabel: string,
  ) => {
    setCards((prev) =>
      prev.map((c) =>
        c.id === cardId ? { ...c, workplaceId, workplaceLabel } : c,
      ),
    );
  };

  const handleSaved = (cardId: string) => {
    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, saved: true } : c)),
    );
  };

  const remaining = cards.filter((c) => !c.saved).length;

  return (
    <main
      className="min-h-screen bg-muted/30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <MobileHeader
        title="캡쳐로 후기 등록"
        backHref="/admin"
        backLabel="어드민"
      />

      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        <UploadSection onExtractedReviews={handleExtractedReviews} />

        {cards.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-t pt-6">
              <p className="text-sm text-muted-foreground">
                추출된 후기 {cards.length}개 · 남은 저장 {remaining}개
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCards([])}
              >
                목록 비우기
              </Button>
            </div>
            {cards.map((card, i) => (
              <ExtractedCardEditor
                key={card.id}
                index={i + 1}
                card={card}
                onMatched={(id, label) => handleMatched(card.id, id, label)}
                onSaved={() => handleSaved(card.id)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
