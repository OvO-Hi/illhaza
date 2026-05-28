import { PrismaClient } from "@prisma/client";
import { hashEmail, encryptEmail } from "../src/lib/crypto";

const prisma = new PrismaClient();

async function main() {
  // 어드민 이메일 환경변수에서 시드 (콤마 구분 가능)
  const adminEmails =
    process.env.SEED_ADMIN_EMAILS?.split(",")
      .map((e) => e.trim())
      .filter(Boolean) ?? [];

  if (adminEmails.length === 0) {
    console.log("ℹ SEED_ADMIN_EMAILS가 비어 있어 시드할 어드민이 없습니다.");
    return;
  }

  for (const email of adminEmails) {
    const emailHash = hashEmail(email);
    const emailEncrypted = encryptEmail(email);
    const domain = email.endsWith("@ewha.ac.kr") ? "EWHA_AC_KR" : "EWHAIN_NET";

    await prisma.user.upsert({
      where: { emailHash },
      update: { role: "ADMIN" },
      create: {
        emailHash,
        emailEncrypted,
        emailDomain: domain,
        role: "ADMIN",
      },
    });
    console.log(`✔ Seeded admin: ${email}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
