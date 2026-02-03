'use client';

import { useEffect, useRef } from 'react';

export type LatLng = { lat: number; lng: number };

type PickMapProps = {
  onPick: (p: LatLng) => void;
  value?: LatLng | null;
  center?: LatLng;
  zoom?: number;
};

export default function PickMap({
  onPick,
  value,
  center,
  zoom = 13,
}: PickMapProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown | null>(null);
  const markerRef = useRef<unknown | null>(null);

  // load Google Maps script + init map once
  useEffect(() => {
    if (!mapDivRef.current) return;

    // Set initial center: prioritize explicit 'center', then 'value', then default (Patras)
    const defaultCenter: LatLng =
      center ?? value ?? { lat: 38.246242, lng: 21.735084 }; // Patras

    const init = () => {
      if (!mapDivRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g || !g.maps) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const map = new g.maps.Map(mapDivRef.current, {
        center: defaultCenter,
        zoom,
        mapTypeControl: false,
        clickableIcons: false,
      });
      mapRef.current = map;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const marker = new g.maps.Marker({
        position: defaultCenter,
        map,
      });
      markerRef.current = marker;

      // Add click listener to set marker and call onPick
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      map.addListener('click', (e: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const event = e as any;
        if (!event.latLng) return;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const p: LatLng = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        marker.setPosition(p);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        map.panTo(p); // Center map on new marker position
        onPick(p);
      });

      // Disable POI info windows
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      map.addListener('click', (e: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((e as any).placeId) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (e as any).stop?.();
        }
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (g && g.maps) {
      init();
      return;
    }

    // Load script only once globally if not already present
    let script = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );
    if (!script) {
      script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'true';
      document.head.appendChild(script);
    }

    // Run init once the script loads
    script.addEventListener('load', init);

    // Cleanup function: remove the load listener
    return () => {
      script?.removeEventListener('load', init);
    };
  }, []); // run once on mount

  // Sync marker and map center if 'value' prop changes (e.g., from geocoding)
  useEffect(() => {
    if (!value || !mapRef.current || !markerRef.current) return;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (markerRef.current as { setPosition: (position: LatLng) => void }).setPosition(value);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    (mapRef.current as { setCenter: (position: LatLng) => void }).setCenter(value);
  }, [value]);

  return (
    <div
      ref={mapDivRef}
      style={{ width: '100%', height: '55vh', minHeight: 400 }} // slightly larger by default
    />
  );
}