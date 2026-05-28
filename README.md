# 일하자 (illhaza)

이화여대 근로장학생을 위한 근로지 후기 공유 모바일 웹앱.

## 기술 스택

- **프레임워크**: Next.js 16 (App Router) + React 19 + TypeScript
- **스타일**: Tailwind CSS v4 + shadcn/ui (base-nova)
- **DB**: PostgreSQL (Neon) + Prisma 6
- **인증**: 자체 OTP 이메일 인증 (`@ewha.ac.kr`, `@ewhain.net`)
- **외부 API**: Naver 지역 검색 + Naver Cloud Maps SDK, ODsay (대중교통), Resend (이메일), Anthropic (어드민 OCR)
- **배포**: Vercel

## 디자인

- 메인 톤: `#00462A` (이화 그린, Tailwind에서 `brand-800` 또는 `bg-brand`)
- 모바일 우선 (PC 반응형은 후속 작업)
- 폰트: Pretendard Variable (CDN)

## 셋업

### 1. 의존성 설치

```bash
npm install
```

`postinstall` 훅이 `prisma generate`를 자동 실행합니다.

### 2. 환경 변수

`.env.example`을 `.env`로 복사한 뒤 값을 채워주세요.

```bash
cp .env.example .env
```

주요 변수 발급 가이드:

| 변수 | 발급처 |
| --- | --- |
| `DATABASE_URL`, `DIRECT_URL` | [Neon Console](https://console.neon.tech) — 프로젝트 생성 후 *Connection string*. `DATABASE_URL`은 pooled, `DIRECT_URL`은 direct |
| `ENCRYPTION_KEY` | 로컬에서 `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `RESEND_API_KEY` | [Resend Dashboard](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | Resend에서 verify한 도메인의 발송 주소 |
| `NAVER_SEARCH_CLIENT_ID`, `NAVER_SEARCH_CLIENT_SECRET` | [Naver Developers](https://developers.naver.com) → 애플리케이션 등록 → 사용 API에서 **검색** 선택, 환경에 **웹 서비스 URL** 추가 |
| `NEXT_PUBLIC_NCP_MAP_CLIENT_ID` | [Naver Cloud Platform](https://www.ncloud.com) → AI·NAVER API → Application 등록 → Maps 서비스 활성화 → Client ID (Web Dynamic Map) |
| `ODSAY_API_KEY` | [ODsay LAB](https://lab.odsay.com) |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) |
| `SEED_ADMIN_EMAILS` | 초기 어드민으로 등록할 이메일 (콤마 구분). 시드 후 `ADMIN_EMAIL_HASHES` 채움 |

### 3. DB 마이그레이션 (최초 1회)

Neon 사용 시 `pg_trgm` extension은 마이그레이션이 자동으로 생성합니다. 미작동 시 Neon Console SQL Editor에서:

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

이후:

```bash
npm run db:migrate -- --name init
```

### 4. 어드민 시드 (선택)

`.env`에 `SEED_ADMIN_EMAILS`를 채운 뒤:

```bash
npm run db:seed
```

`User.emailHash`가 생성됩니다. 출력된 해시(또는 `prisma studio`에서 확인)를 `.env`의 `ADMIN_EMAIL_HASHES`에 콤마로 채워주세요.

### 5. 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 *셋업 완료* 페이지가 brand 컬러로 표시되면 정상.

## NPM 스크립트

| 스크립트 | 설명 |
| --- | --- |
| `npm run dev` | 개발 서버 (Turbopack) |
| `npm run build` | 프로덕션 빌드 |
| `npm run start` | 프로덕션 서버 |
| `npm run lint` | ESLint |
| `npm run db:push` | 마이그레이션 없이 스키마 강제 동기화 (개발 초기용) |
| `npm run db:migrate` | 마이그레이션 생성·적용 |
| `npm run db:seed` | 어드민 시드 |
| `npm run db:studio` | Prisma Studio (DB GUI) |

## 디렉토리 구조

```
src/
├── app/             # Next.js App Router 페이지·레이아웃
│   ├── layout.tsx   # Pretendard, Sonner toaster, viewport 설정
│   ├── page.tsx     # 임시 홈
│   └── globals.css  # Tailwind v4 + 브랜드 색상 + safe-area 변수
├── components/
│   └── ui/          # shadcn 컴포넌트 (button, dialog, form ...)
└── lib/
    ├── prisma.ts    # Prisma 싱글톤
    ├── crypto.ts    # 이메일 해시·AES-GCM 암복호화, OTP/디바이스 토큰
    ├── email.ts     # @ewha.ac.kr / @ewhain.net 도메인 검증
    ├── nickname.ts  # 후기별 "익명N" 닉네임 풀
    └── utils.ts     # shadcn cn() 헬퍼

prisma/
├── schema.prisma    # User / Workplace / Review / Comment / ...
└── seed.ts          # 어드민 시드 스크립트
```

## 배포

Vercel에 연결 후 환경 변수를 모두 등록하세요. Neon의 `DATABASE_URL`은 pooled, `DIRECT_URL`은 direct 연결 문자열을 사용합니다.
