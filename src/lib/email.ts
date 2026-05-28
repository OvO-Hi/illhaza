import { EmailDomain } from "@prisma/client";

const ALLOWED_DOMAINS = {
  "ewha.ac.kr": EmailDomain.EWHA_AC_KR,
  "ewhain.net": EmailDomain.EWHAIN_NET,
} as const;

export function validateEwhaEmail(email: string): {
  valid: boolean;
  domain?: EmailDomain;
  error?: string;
} {
  const trimmed = email.toLowerCase().trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return { valid: false, error: "올바른 이메일 형식이 아닙니다" };
  }

  const domain = trimmed.split("@")[1];
  const matched = ALLOWED_DOMAINS[domain as keyof typeof ALLOWED_DOMAINS];

  if (!matched) {
    return {
      valid: false,
      error: "이화여대 이메일(@ewha.ac.kr, @ewhain.net)만 사용 가능합니다",
    };
  }

  return { valid: true, domain: matched };
}
