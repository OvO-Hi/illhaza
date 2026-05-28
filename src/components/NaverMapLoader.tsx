"use client";

import Script from "next/script";
import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type NaverMapsApi = {
  Map: new (element: HTMLElement, options: object) => unknown;
  LatLng: new (lat: number, lng: number) => unknown;
  Marker: new (options: object) => unknown;
};

declare global {
  interface Window {
    naver?: {
      maps: NaverMapsApi;
    };
  }
}

const NaverMapContext = createContext<{ loaded: boolean }>({ loaded: false });

export function NaverMapProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const clientId = process.env.NEXT_PUBLIC_NCP_MAP_CLIENT_ID;

  return (
    <NaverMapContext.Provider value={{ loaded }}>
      {clientId ? (
        <Script
          src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${clientId}`}
          strategy="afterInteractive"
          onLoad={() => setLoaded(true)}
        />
      ) : null}
      {children}
    </NaverMapContext.Provider>
  );
}

export function useNaverMap() {
  return useContext(NaverMapContext);
}
