import Link from "next/link";
import { MobileHeader } from "@/components/MobileHeader";

export const metadata = {
  title: "이용약관 | 일하자",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <MobileHeader title="이용약관" backHref="/" backLabel="홈" />

      <article className="mx-auto max-w-2xl space-y-6 px-4 py-6 text-sm leading-relaxed text-foreground/90">
        <Section title="제1조 (목적)">
          이 약관은 일하자(illhaza, 이하 &quot;서비스&quot;)가 제공하는 이화여자대학교
          근로장학생 근로지 후기 공유 서비스의 이용에 관하여 필요한 사항을
          규정함을 목적으로 합니다.
        </Section>

        <Section title="제2조 (이용 자격)">
          서비스는 이화여자대학교 재학생·졸업생·교직원이 본인 명의의 학교
          이메일(@ewha.ac.kr / @ewhain.net)을 통한 인증 후 이용할 수 있습니다.
        </Section>

        <Section title="제3조 (게시물에 관한 권리)">
          이용자가 작성한 후기·댓글의 저작권은 작성자에게 있습니다. 단, 서비스는
          이용자가 작성한 게시물을 서비스 운영 목적 내에서 사용·저장·게시할 수
          있습니다.
        </Section>

        <Section title="제4조 (회원 탈퇴 및 게시물)">
          회원이 탈퇴할 경우 작성한 후기·댓글은 익명화되어 서비스 내에
          유지됩니다. 이는 다른 회원의 정보 접근권을 보호하고 서비스의 데이터
          일관성을 유지하기 위함입니다. 단, 본인이 작성한 후기나 댓글의 삭제를
          원하는 경우 탈퇴 전에 개별 삭제 요청을 통해 처리할 수 있습니다.
        </Section>

        <Section title="제5조 (금지 행위)">
          <p>다음 행위는 금지됩니다:</p>
          <ul className="ml-4 mt-2 list-disc space-y-1">
            <li>타인을 비방·모욕하거나 허위 사실을 유포하는 행위</li>
            <li>특정 개인의 신원이 드러나도록 작성하는 행위</li>
            <li>서비스의 정상 운영을 방해하는 행위</li>
            <li>법령에 위배되는 행위</li>
          </ul>
        </Section>

        <Section title="제6조 (게시물 관리)">
          서비스 운영자는 위 금지 행위에 해당하거나 신고가 접수된 게시물을
          비공개 또는 삭제할 수 있습니다.
        </Section>

        <Section title="제7조 (책임의 한계)">
          서비스에 게시된 후기는 작성자 개인의 경험과 의견이며, 서비스는 내용의
          정확성이나 객관성을 보증하지 않습니다.
        </Section>

        <Section title="부칙">
          이 약관은 2026년 5월 28일부터 시행합니다.
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
