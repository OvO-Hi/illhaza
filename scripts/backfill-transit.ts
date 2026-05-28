import { config } from "dotenv";
import { PrismaClient } from "@prisma/client";
import { getTransitTimesFromEwha } from "../src/lib/odsay";

config();

const prisma = new PrismaClient();

async function main() {
  const targets = await prisma.workplace.findMany({
    where: {
      category: "OFF_CAMPUS",
      OR: [
        { transitMinFromMainGate: null },
        { transitMinFromBackGate: null },
      ],
    },
    select: {
      id: true,
      name: true,
      department: true,
      latitude: true,
      longitude: true,
      transitMinFromMainGate: true,
      transitMinFromBackGate: true,
    },
  });

  console.log(`대상 워크플레이스 ${targets.length}개`);

  let success = 0;
  let failed = 0;

  for (const wp of targets) {
    const label = wp.department ? `${wp.name} — ${wp.department}` : wp.name;
    process.stdout.write(
      `[${success + failed + 1}/${targets.length}] ${label} ... `,
    );

    try {
      const { fromMainGate, fromBackGate } = await getTransitTimesFromEwha(
        wp.latitude,
        wp.longitude,
      );

      if (fromMainGate === null && fromBackGate === null) {
        console.log("실패 (둘 다 null)");
        failed++;
        continue;
      }

      await prisma.workplace.update({
        where: { id: wp.id },
        data: {
          transitMinFromMainGate: fromMainGate,
          transitMinFromBackGate: fromBackGate,
        },
      });

      console.log(
        `정문 ${fromMainGate ?? "null"}분 / 후문 ${fromBackGate ?? "null"}분`,
      );
      success++;

      // ODsay 부하 줄이려고 0.5초 간격
      await new Promise((r) => setTimeout(r, 500));
    } catch (e) {
      console.log(`에러: ${e instanceof Error ? e.message : "unknown"}`);
      failed++;
    }
  }

  console.log(`\n완료: ${success}개 성공, ${failed}개 실패`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
