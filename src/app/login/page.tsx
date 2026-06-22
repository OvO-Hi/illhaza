"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const RESEND_COOLDOWN_SEC = 60;

type Step = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [trustDevice, setTrustDevice] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setInterval(() => setResendIn((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [resendIn]);

  const requestCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "코드 발송에 실패했습니다");
        return;
      }
      toast.success("인증 코드를 보냈습니다");
      setStep("code");
      setCode("");
      setResendIn(RESEND_COOLDOWN_SEC);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async () => {
    if (submitting) return;
    if (code.length !== 6) {
      toast.error("6자리 코드를 입력해주세요");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, code, trustDevice }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "로그인에 실패했습니다");
        return;
      }
      router.push("/");
      router.refresh();
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSubmitting(false);
    }
  };

  const onEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void requestCode();
  };

  const onCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void verifyCode();
  };

  return (
    <main
      className="flex min-h-screen flex-col items-center justify-center bg-white px-6"
      style={{
        paddingTop: "calc(env(safe-area-inset-top) + 1.5rem)",
        paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)",
      }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-2xl font-bold text-brand">일하자</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            이화여대 근로장학생을 위한 후기 공유
          </p>
        </div>

        {step === "email" ? (
          <form onSubmit={onEmailSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">이화여대 이메일</Label>
              <Input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="your@ewha.ac.kr"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                @ewha.ac.kr 또는 @ewhain.net 계정만 사용 가능합니다.
              </p>
            </div>
            <Button
              type="submit"
              className="w-full bg-brand text-white hover:bg-brand-700"
              disabled={submitting || !email}
            >
              {submitting ? "전송 중..." : "인증 코드 받기"}
            </Button>
          </form>
        ) : (
          <form onSubmit={onCodeSubmit} className="space-y-6">
            <div className="space-y-2 text-center">
              <p className="text-sm text-foreground">
                <span className="font-medium">{email}</span>
                <br />
                로 보낸 6자리 코드를 입력하세요
              </p>
            </div>

            <div className="flex justify-center">
              <InputOTP
                maxLength={6}
                value={code}
                onChange={setCode}
                autoFocus
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            </div>

            <label className="flex items-center justify-center gap-2 text-sm">
              <Checkbox
                checked={trustDevice}
                onCheckedChange={(v) => setTrustDevice(v === true)}
              />
              <span>이 기기 14일간 기억하기</span>
            </label>

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <Checkbox
                className="mt-0.5"
                checked={agreedToTerms}
                onCheckedChange={(v) => setAgreedToTerms(v === true)}
              />
              <span>
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-brand-700 hover:underline"
                >
                  이용약관
                </Link>
                과{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-brand-700 hover:underline"
                >
                  개인정보처리방침
                </Link>
                에 동의합니다. (탈퇴 시 작성한 후기는 익명화되어 유지됩니다)
              </span>
            </label>

            <Button
              type="submit"
              className="w-full bg-brand text-white hover:bg-brand-700"
              disabled={
                submitting || code.length !== 6 || !agreedToTerms
              }
            >
              {submitting ? "확인 중..." : "로그인"}
            </Button>

            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              하루에 보낼 수 있는 메일 양이 100건으로 한정되어 있고 그 이상부터는
              개발자벗의 카드를 통해 유료결제가 된 후 메일이 발송되니, 메일이 오지
              않더라도 재전송을 누르기 전에 스팸 메일함을 먼저 확인해주세요. 🥹
            </div>

            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setStep("email");
                  setCode("");
                }}
              >
                ← 이메일 다시 입력
              </button>
              <button
                type="button"
                className="text-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={resendIn > 0 || submitting}
                onClick={() => void requestCode()}
              >
                {resendIn > 0 ? `${resendIn}초 후 재전송` : "코드 다시 받기"}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
