import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const contactSchema = z.object({
  contactEmail: z.string().email().max(200),
  subject: z.string().trim().min(1).max(100),
  content: z.string().trim().min(10).max(3000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "입력값 오류" },
      { status: 400 },
    );
  }

  const adminEmails = (process.env.SEED_ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (adminEmails.length === 0) {
    return NextResponse.json(
      { error: "운영자 이메일이 설정되지 않았습니다" },
      { status: 500 },
    );
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "메일 발송 설정이 누락되었습니다" },
      { status: 500 },
    );
  }
  const resend = new Resend(apiKey);

  try {
    const { error } = await resend.emails.send({
      from: `일하자 문의 <${process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"}>`,
      to: adminEmails,
      replyTo: parsed.data.contactEmail,
      subject: `[일하자 문의] ${parsed.data.subject}`,
      text: `보낸 사람: ${parsed.data.contactEmail}\n\n${parsed.data.content}`,
    });
    if (error) {
      throw new Error(error.message ?? "send failed");
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Contact email error:", e);
    return NextResponse.json({ error: "메일 전송 실패" }, { status: 500 });
  }
}
