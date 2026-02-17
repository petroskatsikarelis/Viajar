'use client';

import { useEffect, useRef, useState } from 'react';
import PostPopup from './PostPopup';

// Define the type for the props, ensuring clean structure
type PostProps = {
  posts: {
    id: string;
    title: string;
    description: string | null;
    lat: number;
    lng: number;
    category_slug: string;
  }[];
};

export default function MapView({ posts }: PostProps) {
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<unknown | null>(null);
  const markersRef = useRef<unknown[]>([]);
  const didInitialFitRef = useRef(false);
  const [selectedPost, setSelectedPost] = useState<PostProps['posts'][0] | null>(null);
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null);

  // A mutable ref to hold the function that handles marker updates
  const updateMarkersRef = useRef<((ps: PostProps['posts']) => void) | null>(
    null
  );

  // Init map + define updateMarkers (runs once on mount)
  useEffect(() => {
    if (!mapDivRef.current) return;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g = (window as any).google;

    // --- Core function to create/update markers ---
    updateMarkersRef.current = (currentPosts: PostProps['posts']) => {
      if (!mapRef.current) return;

      // clear old markers
      markersRef.current.forEach((m: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        (m as { setMap: (map: null) => void }).setMap(null);
      });
      markersRef.current = [];

      if (!currentPosts.length) return;

      // Re-fetch google object inside function for safety if it was null initially
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google; 

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const bounds = new g.maps.LatLngBounds();

      currentPosts.forEach((p) => {
        const position = { lat: p.lat, lng: p.lng };

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        const marker = new g.maps.Marker({
          position,
          map: mapRef.current,
          title: p.title,
        });

        // Add click listener for custom popup
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        marker.addListener('click', () => {
          setSelectedPost(p);
          // Use a simpler approach: create an invisible overlay at the marker position
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const map = mapRef.current as any;
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          const markerLatLng = marker.getPosition();
          
          // Get the projection from the map
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          const projection = map.getProjection();
          
          if (projection && markerLatLng) {
            try {
              // Get the marker position in world coordinates
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              const worldPoint = projection.fromLatLngToPoint(markerLatLng);
              // Get the center in world coordinates
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              const centerPoint = projection.fromLatLngToPoint(map.getCenter());
              
              // Calculate scale based on zoom
              // eslint-disable-next-line @typescript-eslint/no-unsafe-call
              const scale = Math.pow(2, map.getZoom());
              
              // Calculate the position relative to the map container
              const mapContainer = mapDivRef.current;
              if (mapContainer) {
                const rect = mapContainer.getBoundingClientRect();
                const x = (worldPoint.x - centerPoint.x) * scale + rect.width / 2 + rect.left;
                const y = (worldPoint.y - centerPoint.y) * scale + rect.height / 2 + rect.top - 40; // Move up by 40px
                setPopupPosition({ x, y });
              }
            } catch (error) {
              console.error('Error calculating popup position:', error);
            }
          }
        });

        markersRef.current.push(marker);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        bounds.extend(position);
      });

      // Fit map only once on initial load, so user zoom/pan is preserved afterwards
      if (!didInitialFitRef.current) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
        (mapRef.current as { fitBounds: (bounds: unknown) => void }).fitBounds(bounds);
        didInitialFitRef.current = true;
      }
    };
    // ---------------------------------------------

    // --- Function to initialize the map ---
    const init = () => {
      if (!mapDivRef.current) return;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g || !g.maps) return;

      const center = { lat: 38.246242, lng: 21.735084 }; // Patras (default center)
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const map = new g.maps.Map(mapDivRef.current, {
        center,
        zoom: 13,
        mapTypeControl: false,
      });
      mapRef.current = map;

      // Apply initial markers
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      updateMarkersRef.current?.(posts);
    };
    // --------------------------------------

    // Check if Google Maps is already loaded
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const g2 = (window as any).google;
    if (g2 && g2.maps) {
      init();
      return;
    }

    // Load Google Maps script if not present
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
    
    // Initialize map after script loads
    script.addEventListener('load', init);

    // Cleanup function: remove listener and clear markers
    return () => {
      script?.removeEventListener('load', init);
      markersRef.current.forEach((m: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        (m as { setMap: (map: null) => void }).setMap(null);
      });
      markersRef.current = [];
    };
  }, []); // run once on mount

  // Sync marker when posts prop changes (e.g., from polling)
  useEffect(() => {
    if (!mapRef.current || !updateMarkersRef.current) return;
    updateMarkersRef.current(posts);
  }, [posts]);

  return (
    <>
      <div
        ref={mapDivRef}
        style={{ width: '100%', height: '80vh' }}
      />
      <PostPopup
        post={selectedPost}
        position={popupPosition}
        onClose={() => {
          setSelectedPost(null);
          setPopupPosition(null);
        }}
      />
    </>
  );
}