'use client';

import { useEffect, useRef } from 'react';

export default function Map() {
  const mapDivRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapDivRef.current) return;

    const center = { lat: 38.246242, lng: 21.735084 }; // Patras

    const init = () => {
      if (!mapDivRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g || !g.maps) return;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const map = new g.maps.Map(mapDivRef.current, {
        center,
        zoom: 13,
      });

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      new g.maps.Marker({
        position: center,
        map,
        title: 'Patras Center',
      });
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;
    if (g && g.maps) {
      init();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(
      'script[data-google-maps="true"]'
    );
    if (!script) {
      script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.defer = true;
      script.dataset.googleMaps = 'true';
      document.head.appendChild(script);
    }
    script.addEventListener('load', init);

    return () => {
      script?.removeEventListener('load', init);
    };
  }, []);

  return (
    <div
      ref={mapDivRef}
      style={{ height: '60vh', width: '100%' }}
    />
  );
}
