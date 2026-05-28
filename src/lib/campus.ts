const CAMPUS_RADIUS_M = 600;

function haversineMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function isOnCampus(lat: number, lng: number): boolean {
  const mainLat = Number(process.env.EWHA_MAIN_GATE_LAT);
  const mainLng = Number(process.env.EWHA_MAIN_GATE_LNG);
  if (!Number.isFinite(mainLat) || !Number.isFinite(mainLng)) {
    throw new Error("EWHA_MAIN_GATE_LAT/LNG not set");
  }
  return haversineMeters(lat, lng, mainLat, mainLng) <= CAMPUS_RADIUS_M;
}
