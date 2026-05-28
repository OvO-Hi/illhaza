import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

export async function sendOtpEmail(email: string, code: string) {
  if (!resend) throw new Error("RESEND_API_KEY not set");

  const from = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev";

  const { error } = await resend.emails.send({
    from: `일하자 <${from}>`,
    to: email,
    subject: `[일하자] 인증 코드: ${code}`,
    html: otpEmailHtml(code),
    text: `일하자 인증 코드: ${code}\n\n5분 이내에 입력해주세요. 본인이 요청하지 않았다면 이 메일을 무시하세요.`,
  });

  if (error) {
    throw new Error(`Resend send failed: ${error.message ?? "unknown"}`);
  }
}

function otpEmailHtml(code: string) {
  return `<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 40px auto; padding: 32px; color: #1a1a1a;">
  <div style="background: #00462A; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="margin: 0; font-size: 20px;">일하자</h1>
  </div>
  <div style="background: #f8f8f8; padding: 32px; border-radius: 0 0 12px 12px;">
    <p style="font-size: 15px; margin: 0 0 24px;">아래 코드를 입력해 로그인을 완료해주세요.</p>
    <div style="background: white; padding: 24px; text-align: center; border-radius: 8px; margin-bottom: 24px;">
      <div style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #00462A; font-family: monospace;">${code}</div>
    </div>
    <p style="font-size: 13px; color: #666; margin: 0;">이 코드는 5분 후 만료됩니다. 본인이 요청하지 않았다면 이 메일을 무시하세요.</p>
  </div>
</body>
</html>`;
}
