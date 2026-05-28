import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DonePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 text-5xl text-brand">✓</div>
      <h1 className="mb-2 text-2xl font-bold text-brand">
        후기가 등록되었어요
      </h1>
      <p className="mb-8 text-sm text-muted-foreground">
        소중한 후기 감사합니다.
      </p>
      <div className="flex gap-3">
        <Link href="/">
          <Button variant="outline">홈으로</Button>
        </Link>
        <Link href="/reviews/new">
          <Button className="bg-brand text-white hover:bg-brand-700">
            다른 근로지 작성
          </Button>
        </Link>
      </div>
    </main>
  );
}
