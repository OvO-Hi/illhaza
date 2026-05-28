const NAVER_LOCAL_BASE = "https://openapi.naver.com/v1/search/local.json";
const NCP_GEOCODE_BASE =
  "https://maps.apigw.ntruss.com/map-geocode/v2/geocode";

export type NaverPlace = {
  id: string; // 네이버는 고유 ID가 없어서 link URL을 ID로 사용
  placeName: string; // title (HTML 태그 제거)
  addressName: string; // address (지번)
  roadAddressName: string; // roadAddress (도로명)
  latitude: number; // mapy를 WGS84로 변환
  longitude: number; // mapx를 WGS84로 변환
  city: string; // "서울특별시" / "경기도" 등
  district: string; // "서대문구" / "고양시 일산동구" 등
  categoryName: string; // category
  phone: string; // telephone
  placeUrl: string; // link
};

type NaverApiItem = {
  title: string;
  link: string;
  category: string;
  description: string;
  telephone: string;
  address: string;
  roadAddress: string;
  mapx: string;
  mapy: string;
};

type NaverApiResponse = {
  lastBuildDate?: string;
  total?: number;
  start?: number;
  display?: number;
  items?: NaverApiItem[];
  errorMessage?: string;
  errorCode?: string;
};

export async function searchNaverPlaces(
  query: string,
  options?: { display?: number },
): Promise<NaverPlace[]> {
  const clientId = process.env.NAVER_SEARCH_CLIENT_ID;
  const clientSecret = process.env.NAVER_SEARCH_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "NAVER_SEARCH_CLIENT_ID / NAVER_SEARCH_CLIENT_SECRET not set",
    );
  }

  const params = new URLSearchParams({
    query,
    display: String(Math.min(options?.display ?? 5, 5)), // 네이버 지역 검색은 최대 5
    start: "1",
    sort: "random",
  });

  const res = await fetch(`${NAVER_LOCAL_BASE}?${params}`, {
    headers: {
      "X-Naver-Client-Id": clientId,
      "X-Naver-Client-Secret": clientSecret,
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver Local API error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as NaverApiResponse;
  if (data.errorCode) {
    throw new Error(`Naver Local API error: ${data.errorMessage}`);
  }

  return (data.items ?? []).map((item) => {
    const placeName = stripHtmlTags(item.title);
    const { latitude, longitude } = naverCoordsToWgs84(item.mapx, item.mapy);
    const { city, district } = extractCityAndDistrict(
      item.address || item.roadAddress,
    );
    return {
      id: item.link || `${item.title}-${item.mapx}-${item.mapy}`,
      placeName,
      addressName: item.address,
      roadAddressName: item.roadAddress,
      latitude,
      longitude,
      city,
      district,
      categoryName: item.category,
      phone: item.telephone,
      placeUrl: item.link,
    };
  });
}

/**
 * 네이버 지역 검색은 title에 <b>강조</b> 태그 포함됨. 제거 필요.
 */
function stripHtmlTags(s: string): string {
  return s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"');
}

/**
 * 네이버 지역 검색의 mapx, mapy는 WGS84를 1e7 배한 정수 형태.
 * 예: mapx="1269459833" mapy="375604789" → 126.9459833, 37.5604789
 */
function naverCoordsToWgs84(
  mapx: string,
  mapy: string,
): { latitude: number; longitude: number } {
  const lng = Number(mapx) / 1e7;
  const lat = Number(mapy) / 1e7;
  return { latitude: lat, longitude: lng };
}

export type CityDistrict = {
  city: string;
  district: string;
};

export type GeocodeResult = {
  latitude: number;
  longitude: number;
  matchedAddress: string;
  city: string;
  district: string;
};

type NcpGeocodeAddress = {
  roadAddress?: string;
  jibunAddress?: string;
  englishAddress?: string;
  addressElements?: Array<{
    types?: string[];
    longName?: string;
    shortName?: string;
  }>;
  x?: string; // longitude
  y?: string; // latitude
};

type NcpGeocodeResponse = {
  status?: string;
  meta?: { totalCount?: number };
  addresses?: NcpGeocodeAddress[];
  errorMessage?: string;
};

/**
 * NCP Geocoding API — 도로명 주소 → 좌표 + 정규화된 주소.
 * 수동 등록 흐름에서 사용.
 */
export async function geocodeAddress(
  query: string,
): Promise<GeocodeResult | null> {
  const clientId = process.env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID;
  const clientSecret = process.env.NCP_MAP_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "NEXT_PUBLIC_NCP_MAP_CLIENT_ID / NCP_MAP_CLIENT_SECRET not set",
    );
  }

  const res = await fetch(
    `${NCP_GEOCODE_BASE}?query=${encodeURIComponent(query)}`,
    {
      headers: {
        "x-ncp-apigw-api-key-id": clientId,
        "x-ncp-apigw-api-key": clientSecret,
      },
    },
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Naver Geocoding error ${res.status}: ${text}`);
  }

  const data = (await res.json()) as NcpGeocodeResponse;
  const first = data.addresses?.[0];
  if (!first || !first.x || !first.y) return null;

  const matchedAddress = first.roadAddress || first.jibunAddress || query;
  const { city, district } = extractCityAndDistrict(matchedAddress);

  return {
    latitude: Number(first.y),
    longitude: Number(first.x),
    matchedAddress,
    city,
    district,
  };
}

/**
 * 주소 문자열에서 시(1차) + 구(2차) 추출.
 * - "서울특별시 서대문구 대현동 11-1" → { city: "서울특별시", district: "서대문구" }
 * - "경기도 고양시 일산동구 ..."    → { city: "경기도", district: "고양시 일산동구" }
 * - "부산광역시 수영구 ..."         → { city: "부산광역시", district: "수영구" }
 */
function extractCityAndDistrict(addressName: string): CityDistrict {
  if (!addressName) return { city: "기타", district: "기타" };

  const tokens = addressName.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return { city: "기타", district: "기타" };

  const city = tokens[0];

  const districtParts: string[] = [];
  for (let i = 1; i < tokens.length; i++) {
    const token = tokens[i];
    if (
      token.endsWith("시") ||
      token.endsWith("군") ||
      token.endsWith("구")
    ) {
      districtParts.push(token);
      const next = tokens[i + 1];
      // "고양시" 다음에 "일산동구"가 오면 둘 다 묶음
      if (next && next.endsWith("구") && !token.endsWith("구")) {
        districtParts.push(next);
      }
      break;
    }
  }

  const district =
    districtParts.length > 0 ? districtParts.join(" ") : (tokens[1] ?? "기타");
  return { city, district };
}
