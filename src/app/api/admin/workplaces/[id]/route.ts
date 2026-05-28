import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const workplace = await prisma.workplace.findUnique({
    where: { id },
    select: { id: true, _count: { select: { reviews: true } } },
  });
  if (!workplace) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  if (workplace._count.reviews > 0) {
    return NextResponse.json(
      {
        error: `이 근로지에 ${workplace._count.reviews}개의 후기가 있어 삭제할 수 없습니다`,
      },
      { status: 400 },
    );
  }

  await prisma.workplace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
