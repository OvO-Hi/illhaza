"use client";

import { useEffect, useRef } from "react";
import { useNaverMap } from "./NaverMapLoader";

type Props = {
  latitude: number;
  longitude: number;
  zoom?: number; // 네이버는 1~21, 클수록 확대
  height?: number;
};

export function WorkplaceMap({
  latitude,
  longitude,
  zoom = 16,
  height = 200,
}: Props) {
  const { loaded } = useNaverMap();
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loaded || !mapRef.current || !window.naver) return;
    const { naver } = window;
    const center = new naver.maps.LatLng(latitude, longitude);
    const map = new naver.maps.Map(mapRef.current, {
      center,
      zoom,
      draggable: false,
      pinchZoom: false,
      scrollWheel: false,
      keyboardShortcuts: false,
      disableDoubleTapZoom: true,
      disableDoubleClickZoom: true,
    });
    new naver.maps.Marker({ map, position: center });
  }, [loaded, latitude, longitude, zoom]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height: `${height}px`, borderRadius: 12 }}
    />
  );
}
