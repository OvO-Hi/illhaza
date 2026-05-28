import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashDeviceToken } from "@/lib/crypto";
import { getDeviceCookie, clearAuthCookies } from "@/lib/session";

export async function POST() {
  const deviceToken = await getDeviceCookie();
  if (deviceToken) {
    const tokenHash = hashDeviceToken(deviceToken);
    await prisma.device.deleteMany({ where: { deviceTokenHash: tokenHash } });
  }

  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
