import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Toaster } from "@/components/ui/sonner";
import { NaverMapProvider } from "@/components/NaverMapLoader";
import { Watermark } from "@/components/Watermark";
import { getCurrentUser } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "일하자 | 이화여대 근로장학생 후기",
    template: "%s | 일하자",
  },
  description: "이화여대 근로장학생을 위한 근로지 후기 공유 서비스",
  openGraph: {
    title: "일하자",
    description: "이화여대 근로장학생을 위한 근로지 후기 공유 서비스",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#00462A",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col font-sans">
        <NaverMapProvider>
          {user && <Watermark identifier={user.emailLocal} />}
          <div className="flex flex-1 flex-col">
            <div className="flex-1">{children}</div>
            <footer
              className="mt-12 border-t bg-background py-6"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 24px)",
              }}
            >
              <div className="mx-auto max-w-2xl px-4">
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <Link href="/terms" className="hover:text-brand">
                    이용약관
                  </Link>
                  <span className="text-muted-foreground/40">·</span>
                  <Link href="/privacy" className="hover:text-brand">
                    개인정보처리방침
                  </Link>
                  <span className="text-muted-foreground/40">·</span>
                  <Link href="/contact" className="hover:text-brand">
                    문의하기
                  </Link>
                </div>
                <p className="mt-2 text-center text-xs text-muted-foreground/70">
                  © 2026 일하자 (illhaza)
                </p>
              </div>
            </footer>
          </div>
        </NaverMapProvider>
        <Toaster />
      </body>
    </html>
  );
}
