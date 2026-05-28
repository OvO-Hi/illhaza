import Link from "next/link";
import { MobileHeader } from "@/components/MobileHeader";

export const metadata = {
  title: "개인정보처리방침 | 일하자",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <MobileHeader title="개인정보처리방침" backHref="/" backLabel="홈" />

      <article className="mx-auto max-w-2xl space-y-6 px-4 py-6 text-sm leading-relaxed text-foreground/90">
        <Section title="1. 수집하는 개인정보">
          <p>일하자는 다음의 개인정보를 수집합니다:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              <strong>이메일 주소</strong>: 가입 인증·OTP 발송용 (해시 저장)
            </li>
            <li>
              <strong>기기 정보</strong>: 신뢰 기기 식별을 위한 user-agent (선택)
            </li>
            <li>
              <strong>이용 기록</strong>: 작성한 후기·댓글·매칭한 근로지 정보
            </li>
          </ul>
        </Section>

        <Section title="2. 개인정보 처리 목적">
          <ul className="ml-4 list-disc space-y-1">
            <li>이화여대 구성원 확인 및 회원 식별</li>
            <li>서비스 제공 (후기 작성·검색·댓글 등)</li>
            <li>부정 이용 방지 (어뷰징 추적)</li>
          </ul>
        </Section>

        <Section title="3. 보유 및 이용 기간">
          <ul className="ml-4 list-disc space-y-1">
            <li>회원 정보: 회원 자격 유지 기간 동안. 탈퇴 시 즉시 익명화</li>
            <li>이메일 해시: 동일 이메일 재가입 차단을 위해 영구 보관</li>
            <li>OTP 코드: 발급 후 10분</li>
            <li>신뢰 기기 토큰: 14일</li>
            <li>
              작성한 게시물: 서비스 운영 기간 동안 (탈퇴 후에도 익명화 유지)
            </li>
          </ul>
        </Section>

        <Section title="4. 제3자 제공">
          <p>
            이용자의 개인정보는 원칙적으로 외부에 제공하지 않습니다. 단, 다음의
            외부 서비스를 통해 일부 정보가 처리됩니다:
          </p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              Resend (이메일 발송): OTP 코드 전송 시 이메일 주소가 일시적으로
              전달됩니다.
            </li>
            <li>
              Anthropic Claude (어드민 OCR 기능): 어드민이 등록한 캡쳐 이미지
              분석에만 사용되며, 일반 이용자 데이터는 전달되지 않습니다.
            </li>
            <li>Neon (데이터베이스): 모든 데이터가 저장됩니다.</li>
          </ul>
        </Section>

        <Section title="5. 이용자의 권리">
          <p>이용자는 언제든지 다음의 권리를 행사할 수 있습니다:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>
              본인이 작성한 후기·댓글 삭제 요청 (후기는 운영자 검토, 댓글은 즉시
              삭제)
            </li>
            <li>회원 탈퇴</li>
            <li>개인정보 처리에 관한 문의</li>
          </ul>
        </Section>

        <Section title="6. 문의">
          개인정보 관련 문의는{" "}
          <Link href="/contact" className="text-brand-700 hover:underline">
            문의하기
          </Link>
          를 통해 접수해주세요.
        </Section>

        <Section title="부칙">
          이 처리방침은 2026년 5월 28일부터 시행합니다.
        </Section>

        <p className="pt-4 text-center">
          <Link href="/" className="text-brand-700 hover:underline">
            ← 홈으로
          </Link>
        </p>
      </article>
    </main>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-bold text-foreground">{title}</h2>
      <div>{children}</div>
    </section>
  );
}
