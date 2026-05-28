import { prisma } from "./prisma";
import { hashDeviceToken } from "./crypto";
import {
  getSessionCookie,
  getDeviceCookie,
  verifySession,
} from "./session";

export type CurrentUser = {
  id: string;
  role: "USER" | "ADMIN";
  status: "ACTIVE" | "DELETED";
};

/**
 * Read-only. 쿠키 set/delete 안 함 (서버 컴포넌트에서 안전).
 * 1) session 쿠키 검증 → user 반환
 * 2) session 없거나 무효면 device 쿠키 검증 → user 반환
 * 3) 둘 다 없으면 null
 *
 * 만료된 device 레코드는 DB에 남겨두되 expiresAt 조건으로 무시. 정리는 cron 별도.
 * 만료된 device 쿠키는 다음 로그인에서 verify route가 새 토큰으로 덮어씀.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const sessionToken = await getSessionCookie();
  if (sessionToken) {
    const payload = await verifySession(sessionToken);
    if (payload) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { id: true, role: true, status: true },
      });
      if (user && user.status === "ACTIVE") return user;
      return null;
    }
  }

  const deviceToken = await getDeviceCookie();
  if (deviceToken) {
    const tokenHash = hashDeviceToken(deviceToken);
    const device = await prisma.device.findUnique({
      where: { deviceTokenHash: tokenHash },
      include: { user: { select: { id: true, role: true, status: true } } },
    });

    if (
      device &&
      device.expiresAt > new Date() &&
      device.user.status === "ACTIVE"
    ) {
      // lastUsedAt 갱신 (fire-and-forget)
      prisma.device
        .update({
          where: { id: device.id },
          data: { lastUsedAt: new Date() },
        })
        .catch(() => {});

      return {
        id: device.user.id,
        role: device.user.role,
        status: device.user.status,
      };
    }
  }

  return null;
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new Error("FORBIDDEN");
  return user;
}
