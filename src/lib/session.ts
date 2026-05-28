import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SESSION_COOKIE = "illhaza_session";
const DEVICE_COOKIE = "illhaza_device";
const SESSION_DURATION_HOURS = 24;
const DEVICE_DURATION_DAYS = 14;

function getSecret(): Uint8Array {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set");
  return new Uint8Array(Buffer.from(key, "base64"));
}

export type SessionPayload = {
  userId: string;
  role: "USER" | "ADMIN";
  emailLocal: string; // 이메일의 @ 앞부분 (워터마크 식별자)
};

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(getSecret());
}

export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    const userId = payload.userId;
    const role = payload.role;
    const emailLocal = payload.emailLocal;
    if (typeof userId !== "string") return null;
    if (role !== "USER" && role !== "ADMIN") return null;
    return {
      userId,
      role,
      emailLocal: typeof emailLocal === "string" ? emailLocal : "",
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: SessionPayload) {
  const token = await signSession(payload);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function setDeviceCookie(deviceToken: string) {
  const store = await cookies();
  store.set(DEVICE_COOKIE, deviceToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DEVICE_DURATION_DAYS * 24 * 60 * 60,
  });
}

export async function clearAuthCookies() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(DEVICE_COOKIE);
}

export async function getSessionCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value;
}

export async function getDeviceCookie(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(DEVICE_COOKIE)?.value;
}

export const COOKIE_NAMES = {
  SESSION: SESSION_COOKIE,
  DEVICE: DEVICE_COOKIE,
} as const;
export const DEVICE_DURATION_MS =
  DEVICE_DURATION_DAYS * 24 * 60 * 60 * 1000;
