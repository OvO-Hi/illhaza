export const WORK_PERIOD_TYPE_LABELS = {
  SEMESTER: "학기 근로",
  INTENSIVE: "방학 집중 근로",
  BOTH: "둘 다 경험",
} as const;

export const WORK_TERM_LABELS = {
  SPRING: "1학기 (봄)",
  FALL: "2학기 (가을)",
  SUMMER: "여름방학",
  WINTER: "겨울방학",
} as const;

export const WORK_DURATION_LABELS = {
  ONE_SEMESTER: "한 학기",
  TWO_SEMESTERS: "두 학기",
  YEAR_PLUS: "1년 이상",
} as const;

export const INCOME_BRACKET_LABELS = {
  LOW: "낮음 (1~3분위)",
  MID: "중간 (4~7분위)",
  HIGH: "높음 (8~10분위)",
} as const;

export const TASK_TYPE_LABELS = {
  OFFICE: "사무 (서류 정리, 엑셀 입력 등)",
  PHONE: "전화 응대",
  IN_PERSON: "대면 응대 (방문객·이용자)",
  RESEARCH: "자료 조사·리서치",
  WRITING: "글쓰기·콘텐츠 제작",
  EVENT: "행사·이벤트 지원",
  REPETITIVE: "단순 반복 (분쇄, 정리 등)",
  SAFETY: "안전 관리·지킴이",
  PROFESSIONAL: "전문 업무 (디자인·개발 등)",
  OTHER: "기타",
} as const;

export const STUDY_POSSIBILITY_LABELS = {
  POSSIBLE: "가능",
  LIMITED: "제한적",
  IMPOSSIBLE: "불가능",
} as const;

export const WORK_ENVIRONMENT_LABELS = {
  ALONE: "혼자 근무",
  WITH_PEERS: "다른 근로생과 함께",
  WITH_STAFF: "직원과 같은 공간",
} as const;

export const COWORKER_TYPE_LABELS = {
  STAFF: "교직원",
  STUDENT: "학생",
  EXTERNAL: "외부인 (자원봉사자 등)",
} as const;

export const RECOMMEND_TAG_LABELS = {
  STUDY_FRIENDLY: "개인공부 하고 싶은 사람",
  ACTIVE_WORK: "활동적인 업무 선호",
  LIKES_PEOPLE: "사람 응대 좋아함",
  AVOIDS_PEOPLE: "응대 업무 피하고 싶은 사람",
  NEW_EXPERIENCE: "색다른 경험 원함",
  CAREER_FIT: "기자·공연기획 등 진로 관심",
} as const;

/**
 * 대중교통 분 단위 표시. 10분 이하는 "10분 내"로 묶어서 표기 (도보 거리 포함).
 */
export function formatTransitMinutes(min: number | null): string {
  if (min === null) return "?";
  if (min <= 10) return "10분 내";
  return `${min}분`;
}

export const AUTONOMY_SCORE_LABELS: Record<number, string> = {
  1: "1점 — 계속 업무, 개인 시간 없음",
  2: "2점 — 가끔 여유, 폰 정도만",
  3: "3점 — 적당히 한가, 눈치 보임",
  4: "4점 — 한가할 때 많음, 노트북 작업 가능",
  5: "5점 — 거의 자율, 개인공부 자유",
};
