import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export type WorkplaceCardData = {
  id: string;
  name: string;
  department: string | null;
  district: string;
  category: "ON_CAMPUS" | "OFF_CAMPUS";
  transitMinFromMainGate: number | null;
  transitMinFromBackGate: number | null;
  reviewCount: number;
  avgRating: number | null;
};

export function WorkplaceCard({ wp }: { wp: WorkplaceCardData }) {
  return (
    <Link
      href={`/workplaces/${wp.id}`}
      className="block rounded-lg border bg-card p-4 transition active:bg-muted hover:border-brand-400 hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-bold">
          {wp.name}
          {wp.department && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              — {wp.department}
            </span>
          )}
        </h3>
        {wp.category === "ON_CAMPUS" && (
          <Badge className="shrink-0 bg-brand text-white hover:bg-brand-700">
            학내
          </Badge>
        )}
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <span>{wp.district}</span>
        {wp.category === "OFF_CAMPUS" && (
          <>
            {wp.transitMinFromMainGate !== null && (
              <>
                <span>·</span>
                <span>정문 {wp.transitMinFromMainGate}분</span>
              </>
            )}
            {wp.transitMinFromBackGate !== null && (
              <>
                <span>·</span>
                <span>후문 {wp.transitMinFromBackGate}분</span>
              </>
            )}
          </>
        )}
      </div>

      <div className="mt-2 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">후기 {wp.reviewCount}개</span>
        {wp.avgRating !== null && (
          <span className="text-amber-600">★ {wp.avgRating.toFixed(1)}</span>
        )}
      </div>
    </Link>
  );
}
