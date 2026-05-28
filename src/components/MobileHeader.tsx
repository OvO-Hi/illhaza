import Link from "next/link";
import { ChevronLeft } from "lucide-react";

type Props = {
  title: string;
  backHref?: string;
  backLabel?: string;
  rightSlot?: React.ReactNode;
};

export function MobileHeader({
  title,
  backHref,
  backLabel,
  rightSlot,
}: Props) {
  return (
    <header
      className="sticky top-0 z-10 border-b bg-background/90 px-4 py-3 backdrop-blur"
      style={{ paddingTop: "calc(env(safe-area-inset-top) + 12px)" }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="w-10">
          {backHref && (
            <Link
              href={backHref}
              aria-label={backLabel ?? "뒤로"}
              className="-ml-2 inline-flex h-10 w-10 items-center justify-center text-muted-foreground transition-colors hover:text-brand"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          )}
        </div>
        <h1 className="flex-1 truncate text-center text-base font-bold">
          {title}
        </h1>
        <div className="flex w-10 justify-end">{rightSlot}</div>
      </div>
    </header>
  );
}
