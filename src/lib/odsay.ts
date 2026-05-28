const PROXY_URL = process.env.ODSAY_PROXY_URL;
const PROXY_SECRET = process.env.ODSAY_PROXY_SECRET;

// ODsay -98: 출도착지가 700m 이내(도보 거리)라 경로 산출 불가. 8분으로 채움.
const WALKABLE_DISTANCE_MINUTES = 8;

export type TransitResult = {
  totalMinutes: number | null;
};

type OdsayErrorEntry = {
  code?: string;
  msg?: string;
  message?: string;
};

type OdsayResponse = {
  result?: {
    path?: Array<{
      info?: {
        totalTime?: number;
      };
    }>;
  };
  error?: OdsayErrorEntry[] | OdsayErrorEntry;
};

export async function getTransitTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<TransitResult> {
  if (!PROXY_URL || !PROXY_SECRET) {
    console.error("ODSAY_PROXY_URL or ODSAY_PROXY_SECRET not set");
    return { totalMinutes: null };
  }

  const params = new URLSearchParams({
    SX: String(fromLng),
    SY: String(fromLat),
    EX: String(toLng),
    EY: String(toLat),
  });

  try {
    const res = await fetch(
      `${PROXY_URL}/odsay/searchPubTransPathT?${params}`,
      {
        headers: { "x-proxy-secret": PROXY_SECRET },
        next: { revalidate: 86400 },
      },
    );
    if (!res.ok) {
      console.error("ODsay proxy error", res.status);
      return { totalMinutes: null };
    }
    const data = (await res.json()) as OdsayResponse;

    if (data.error) {
      // ODsay는 error를 배열로 줄 때도 있고 단일 객체로 줄 때도 있음
      const errors = Array.isArray(data.error) ? data.error : [data.error];
      // -98 (700m 이내): 도보 거리로 간주
      if (errors.some((e) => e?.code === "-98")) {
        return { totalMinutes: WALKABLE_DISTANCE_MINUTES };
      }
      console.warn("ODsay error:", data.error);
      return { totalMinutes: null };
    }

    const firstPath = data.result?.path?.[0];
    const totalTime = firstPath?.info?.totalTime;
    return { totalMinutes: typeof totalTime === "number" ? totalTime : null };
  } catch (e) {
    console.error("ODsay proxy fetch failed", e);
    return { totalMinutes: null };
  }
}

/**
 * 학교 정문/후문 양쪽에서 대중교통 시간 계산. 병렬 호출.
 */
export async function getTransitTimesFromEwha(
  destLat: number,
  destLng: number,
): Promise<{ fromMainGate: number | null; fromBackGate: number | null }> {
  const mainLat = Number(process.env.EWHA_MAIN_GATE_LAT);
  const mainLng = Number(process.env.EWHA_MAIN_GATE_LNG);
  const backLat = Number(process.env.EWHA_BACK_GATE_LAT);
  const backLng = Number(process.env.EWHA_BACK_GATE_LNG);

  if (
    !Number.isFinite(mainLat) ||
    !Number.isFinite(mainLng) ||
    !Number.isFinite(backLat) ||
    !Number.isFinite(backLng)
  ) {
    throw new Error("EWHA gate coordinates not set");
  }

  const [main, back] = await Promise.all([
    getTransitTime(mainLat, mainLng, destLat, destLng).catch(() => ({
      totalMinutes: null,
    })),
    getTransitTime(backLat, backLng, destLat, destLng).catch(() => ({
      totalMinutes: null,
    })),
  ]);

  return { fromMainGate: main.totalMinutes, fromBackGate: back.totalMinutes };
}
