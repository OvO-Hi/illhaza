"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MobileHeader } from "@/components/MobileHeader";

const MAX_CONTENT = 3000;

export function ContactClient() {
  const [contactEmail, setContactEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (sending) return;
    const e = contactEmail.trim();
    const s = subject.trim();
    const c = content.trim();
    if (!e || !s || c.length < 10) {
      toast.error("이메일·제목·내용(10자 이상)을 모두 입력해주세요");
      return;
    }
    setSending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          contactEmail: e,
          subject: s,
          content: c,
        }),
      });
      const data: { ok?: boolean; error?: string } = await res
        .json()
        .catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "전송 실패");
        return;
      }
      setSent(true);
    } catch {
      toast.error("네트워크 오류");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="space-y-3 text-center">
          <div className="text-4xl">✉️</div>
          <h1 className="text-lg font-bold">문의가 접수되었어요</h1>
          <p className="text-sm text-muted-foreground">
            운영자가 확인 후 답변드리겠습니다.
          </p>
          <Link
            href="/"
            className="inline-block text-sm text-brand-700 hover:underline"
          >
            ← 홈으로
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-muted/30"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <MobileHeader title="문의하기" backHref="/" backLabel="홈" />

      <div className="mx-auto max-w-md space-y-4 px-4 py-6">
        <p className="text-sm text-muted-foreground">
          서비스 이용 중 불편하셨거나 건의하실 내용이 있으면 보내주세요.
        </p>

        <div className="space-y-1">
          <Label htmlFor="contact-email">답변받을 이메일</Label>
          <Input
            id="contact-email"
            type="email"
            inputMode="email"
            value={contactEmail}
            onChange={(e) => setContactEmail(e.target.value)}
            placeholder="example@ewha.ac.kr"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="contact-subject">제목</Label>
          <Input
            id="contact-subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value.slice(0, 100))}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="contact-content">내용</Label>
          <Textarea
            id="contact-content"
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT))}
            rows={8}
            placeholder="10자 이상 자유롭게 작성해주세요"
            className="resize-none"
          />
          <div className="text-right text-xs text-muted-foreground">
            {content.length} / {MAX_CONTENT}
          </div>
        </div>

        <Button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={sending}
          className="w-full bg-brand text-white hover:bg-brand-700"
        >
          {sending ? "전송 중..." : "보내기"}
        </Button>
      </div>
    </main>
  );
}
