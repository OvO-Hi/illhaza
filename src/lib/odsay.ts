const ODSAY_BASE = "https://api.odsay.com/v1/api/searchPubTransPathT";

export type TransitResult = {
  totalMinutes: number | null;
};

type OdsayResponse = {
  result?: {
    path?: Array<{
      info?: {
        totalTime?: number;
      };
    }>;
  };
  error?: Array<{ code?: string; msg?: string }>;
};

export async function getTransitTime(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): Promise<TransitResult> {
  const apiKey = process.env.ODSAY_API_KEY;
  if (!apiKey) throw new Error("ODSAY_API_KEY not set");

  const params = new URLSearchParams({
    apiKey,
    SX: String(fromLng),
    SY: String(fromLat),
    EX: String(toLng),
    EY: String(toLat),
    OPT: "0",
  });

  const res = await fetch(`${ODSAY_BASE}?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) {
    throw new Error(`ODsay error ${res.status}`);
  }
  const data = (await res.json()) as OdsayResponse;

  if (data.error) {
    console.warn("ODsay error:", data.error);
    return { totalMinutes: null };
  }

  const firstPath = data.result?.path?.[0];
  const totalTime = firstPath?.info?.totalTime;
  return { totalMinutes: typeof totalTime === "number" ? totalTime : null };
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
