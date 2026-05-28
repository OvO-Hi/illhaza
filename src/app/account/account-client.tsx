"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MobileHeader } from "@/components/MobileHeader";

export function AccountClient({
  userRole,
}: {
  userRole: "USER" | "ADMIN";
}) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleWithdraw = async () => {
    if (confirmText !== "탈퇴합니다" || withdrawing) return;
    setWithdrawing(true);
    try {
      const res = await fetch("/api/auth/withdraw", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmText }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "탈퇴 실패");
        return;
      }
      toast.success("탈퇴 처리되었습니다");
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setWithdrawing(false);
    }
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <main
      className="min-h-screen bg-muted/30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <MobileHeader title="내 계정" backHref="/" backLabel="홈" />

      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <section className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 font-bold">계정 정보</h2>
          <p className="text-sm text-muted-foreground">
            이화여대 이메일 인증으로 가입된 계정입니다.
          </p>
          {userRole === "ADMIN" && (
            <p className="mt-2 text-xs text-brand-700">
              어드민 권한이 있습니다.
            </p>
          )}
        </section>

        <section className="rounded-lg border bg-background p-4">
          <h2 className="mb-2 font-bold">로그아웃</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            이 기기에서 로그아웃합니다.
          </p>
          <Button
            variant="outline"
            onClick={() => void handleLogout()}
            disabled={loggingOut}
          >
            {loggingOut ? "로그아웃 중..." : "로그아웃"}
          </Button>
        </section>

        {userRole !== "ADMIN" && (
          <section className="rounded-lg border bg-background p-4">
            <h2 className="mb-2 font-bold text-red-600">회원 탈퇴</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              탈퇴하면 같은 이메일로 다시 가입할 수 없습니다. 작성한 후기와
              댓글은 &quot;(탈퇴한 회원)&quot;으로 표시되며 유지됩니다.
            </p>
            <Button
              variant="outline"
              className="text-red-600 hover:text-red-700"
              onClick={() => {
                setConfirmText("");
                setDialogOpen(true);
              }}
            >
              탈퇴하기
            </Button>
          </section>
        )}

        <section className="pt-4 text-center text-xs text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            이용약관
          </Link>
          {" · "}
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
          {" · "}
          <Link href="/contact" className="hover:text-foreground">
            문의하기
          </Link>
        </section>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setConfirmText("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>정말 탈퇴하시겠어요?</DialogTitle>
            <DialogDescription>
              탈퇴 후에는 같은 이메일로 다시 가입할 수 없습니다. 확인을 위해
              아래에 <strong>탈퇴합니다</strong>를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="탈퇴합니다"
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={withdrawing}
            >
              취소
            </Button>
            <Button
              className="bg-red-600 text-white hover:bg-red-700"
              onClick={() => void handleWithdraw()}
              disabled={confirmText !== "탈퇴합니다" || withdrawing}
            >
              {withdrawing ? "처리 중..." : "탈퇴"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
