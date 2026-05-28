import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ExtractedReview = {
  workplaceName: string;
  workplaceDepartment: string | null;
  locationHint: string | null;
  workPeriodType: "SEMESTER" | "INTENSIVE" | "BOTH" | null;
  workYear: number | null;
  workYearPublic: boolean;
  workTerm: "SPRING" | "FALL" | "SUMMER" | "WINTER" | null;
  workTermPublic: boolean;
  workDuration: "ONE_SEMESTER" | "TWO_SEMESTERS" | "YEAR_PLUS" | null;
  incomeBracket: "LOW" | "MID" | "HIGH" | null;
  incomeBracketPublic: boolean;
  tasks: Array<
    | "OFFICE"
    | "PHONE"
    | "IN_PERSON"
    | "RESEARCH"
    | "WRITING"
    | "EVENT"
    | "REPETITIVE"
    | "SAFETY"
    | "PROFESSIONAL"
    | "OTHER"
  >;
  tasksOtherText: string | null;
  autonomyScore: number | null;
  studyPossibility: "POSSIBLE" | "LIMITED" | "IMPOSSIBLE" | null;
  workEnvironment: "ALONE" | "WITH_PEERS" | "WITH_STAFF" | null;
  coworkerTypes: Array<"STAFF" | "STUDENT" | "EXTERNAL">;
  recommendedFor: Array<
    | "STUDY_FRIENDLY"
    | "ACTIVE_WORK"
    | "LIKES_PEOPLE"
    | "AVOIDS_PEOPLE"
    | "NEW_EXPERIENCE"
    | "CAREER_FIT"
  >;
  overallRating: number | null;
  freeText: string;
};

export async function extractReviewsFromImage(
  base64Image: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp",
): Promise<ExtractedReview[]> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY not set");
  }

  // 시스템 프롬프트로 추출 가이드 전달 + prompt caching (5분 TTL).
  // 이미지(가변)는 user content에. 같은 어드민이 짧은 시간 안에 여러 이미지를
  // 처리하면 system 토큰은 캐시 히트.
  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 8000,
    system: [
      {
        type: "text",
        text: EXTRACTION_PROMPT,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: "이 이미지에서 모든 후기를 위 스키마대로 JSON 배열로 추출해주세요.",
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Claude response has no text block");
  }

  const text = textBlock.text.trim();
  // ```json ... ``` 또는 ``` ... ``` 코드펜스 제거
  const jsonStr = text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/, "")
    .trim();

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch {
    throw new Error(
      `Failed to parse Claude response as JSON: ${text.slice(0, 200)}`,
    );
  }

  if (!Array.isArray(parsed)) {
    throw new Error("Claude response is not an array");
  }

  return parsed as ExtractedReview[];
}

const EXTRACTION_PROMPT = `너는 이화여자대학교 학내 커뮤니티의 근로장학생 근로지 후기 게시판 캡쳐 이미지를 분석해 구조화된 데이터로 변환하는 도우미야.
한 이미지에 여러 사람의 후기가 있을 수 있어. 모든 후기를 추출해서 배열로 반환해.

다음 JSON 스키마로만 응답해 (다른 설명·코드펜스 X, JSON 배열만):

[
  {
    "workplaceName": string,
    "workplaceDepartment": string | null,
    "locationHint": string | null,
    "workPeriodType": "SEMESTER" | "INTENSIVE" | "BOTH" | null,
    "workYear": number | null,
    "workTerm": "SPRING" | "FALL" | "SUMMER" | "WINTER" | null,
    "workDuration": "ONE_SEMESTER" | "TWO_SEMESTERS" | "YEAR_PLUS" | null,
    "incomeBracket": "LOW" | "MID" | "HIGH" | null,
    "incomeBracketPublic": true,
    "tasks": [...],
    "tasksOtherText": string | null,
    "autonomyScore": number | null,
    "studyPossibility": "POSSIBLE" | "LIMITED" | "IMPOSSIBLE" | null,
    "workEnvironment": "ALONE" | "WITH_PEERS" | "WITH_STAFF" | null,
    "coworkerTypes": [...],
    "recommendedFor": [...],
    "overallRating": number | null,
    "freeText": string
  }
]

매핑 가이드:

[workplaceName]: 기관명만. 예: "서대문 자연사 박물관", "서부교육지원청"
[workplaceDepartment]: 같은 기관 안의 부서가 있으면 따로 분리. 예: "서부교육지원청 학교시설지원과" → workplaceName="서부교육지원청", workplaceDepartment="학교시설지원과". 부서 없으면 null

[locationHint]: 위치/교통 언급. 예: "혜화역 2번 출구 바로 앞", "학교에서 버스 1번 환승 30분". 없으면 null

[workPeriodType]:
- 학기 중 = "SEMESTER"
- 방학 집중 = "INTENSIVE"
- 학기·방학 둘 다 경험 언급 = "BOTH"
- 명시 없으면 null

[workYear, workTerm]: 명시된 경우에만. 추측 X. 캡쳐 작성 날짜는 참고 X (사용자 작성 시점과 근로 시기가 다를 수 있음)

[incomeBracket]:
- 분위 언급 있을 때만:
  - 1~3분위 = "LOW"
  - 4~7분위 = "MID"
  - 8~10분위 = "HIGH"
- 명시 없으면 null
- 분위 정보는 캡쳐에 거의 없을 거야. null이 정상

[incomeBracketPublic]: 항상 true

[tasks]: 본문에서 언급된 업무 유형 다중 매칭
- OFFICE: 서류 정리, 엑셀 입력, 사무 등
- PHONE: 전화 응대, 전화 받기
- IN_PERSON: 방문객 응대, 대면 응대
- RESEARCH: 자료 조사, 리서치
- WRITING: 글쓰기, 콘텐츠 제작, 기사 작성
- EVENT: 행사·이벤트 지원
- REPETITIVE: 단순 반복 (분쇄, 정리 등)
- SAFETY: 안전 관리, 지킴이
- PROFESSIONAL: 디자인·개발 등 전문 업무
- OTHER: 위 카테고리에 안 맞는 경우

[tasksOtherText]: OTHER가 tasks에 포함된 경우, 어떤 업무였는지 본문에서 추출. 20자 이상으로 정리. OTHER 없으면 null

[autonomyScore]: 본문의 자율도 묘사를 1-5로
- "거의 자율", "개인공부 자유" = 5
- "한가할 때 많음", "노트북 작업 가능" = 4
- "적당히 한가", "눈치 보임" = 3
- "가끔 여유" = 2
- "계속 업무", "여유 없음" = 1
- 명시 없으면 null

[studyPossibility]:
- "개인공부 가능", "자유롭게 공부함" = POSSIBLE
- "잠깐씩 가능", "눈치 보며" = LIMITED
- "공부 불가능" = IMPOSSIBLE
- 명시 없으면 null

[workEnvironment]:
- "혼자 근무" = ALONE
- "다른 근로생과 함께" = WITH_PEERS
- "직원과 같은 사무실" = WITH_STAFF
- 명시 없으면 null

[coworkerTypes]: 함께 일하는 사람 유형 다중
- STAFF: 교직원, 선생님, 대표 등
- STUDENT: 다른 근로생, 학생
- EXTERNAL: 자원봉사자, 외부인

[recommendedFor]: "~한 사람에게 추천" 같은 표현 또는 본문 톤에서 추천 대상 추출
- STUDY_FRIENDLY: 개인공부 하고 싶은 사람
- ACTIVE_WORK: 활동적 업무 선호
- LIKES_PEOPLE: 사람 응대 좋아함
- AVOIDS_PEOPLE: 응대 업무 피하고 싶은 사람
- NEW_EXPERIENCE: 색다른 경험
- CAREER_FIT: 진로 관심 (기자/공연기획 등)
- 단서 없으면 빈 배열

[overallRating]: 본문의 전체적 추천 톤을 1-5로
- "강추", "너무 좋았음" = 5
- 긍정 = 4
- 보통 = 3
- 약간 부정 = 2
- "지옥", "비추" = 1
- 명시 없거나 중립적이면 null

[freeText]: 본문에서 "특이사항", "기타", 종합적인 분위기 설명 부분을 정리해서 자연스러운 한국어로 담기. 캡쳐의 핵심 내용이 여기 들어가야 함. 빈 문자열이 아니라 의미 있는 내용으로 채울 것 (20자 이상)

**중요**: 본문에 명시되지 않은 필드는 절대 추측하지 마. null로 반환.
**중요**: 한 캡쳐에 여러 후기가 있으면 (예: "1. 서대문 자연사 박물관", "2. 엠에이치앤미디어" 등) 모두 분리해서 배열로 반환.
**중요**: 댓글이나 답글 형태로 짧게 정보만 있는 것도 별도 후기로 분리.
**중요**: JSON 외의 텍스트는 절대 응답에 포함하지 마.`;
