import { Loader2 } from "lucide-react";

type Props = {
  className?: string;
};

export function LoadingSpinner({ className }: Props) {
  return (
    <div className="flex items-center justify-center py-12">
      <Loader2
        className={`h-6 w-6 animate-spin text-brand ${className ?? ""}`}
      />
    </div>
  );
}
