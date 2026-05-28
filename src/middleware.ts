import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PREFIXES = [
  "/login",
  "/api/auth",
  "/terms",
  "/privacy",
  "/contact",
];
const SESSION_COOKIE = "illhaza_session";
const DEVICE_COOKIE = "illhaza_device";

function getSecret(): Uint8Array {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set");
  return new Uint8Array(Buffer.from(key, "base64"));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // API route는 자체적으로 requireUser()로 401 JSON 반환 — 리다이렉트 X
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get(SESSION_COOKIE)?.value;
  const deviceToken = req.cookies.get(DEVICE_COOKIE)?.value;

  if (sessionToken) {
    try {
      await jwtVerify(sessionToken, getSecret());
      return NextResponse.next();
    } catch {
      // 무효 세션 → device 토큰으로 fallback
    }
  }

  // device 토큰만 있는 경우 — Edge에서 DB 조회 불가. 페이지에서 getCurrentUser로 재발급/검증.
  if (deviceToken) {
    return NextResponse.next();
  }

  const loginUrl = new URL("/login", req.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)",
  ],
};
