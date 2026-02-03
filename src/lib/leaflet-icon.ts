// src/lib/leaflet-icon.ts
// so i dont import 'leaflet' at the top (that runs during SSR)

export function patchLeafletIcon() {
  if (typeof window === 'undefined') return; // only run in browser

  // require here so it loads only on client
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const L = require('leaflet') as {
    Icon: {
      Default: {
        prototype: Record<string, unknown>;
        mergeOptions: (options: Record<string, string>) => void;
      };
    };
  };

  // clean defaults, then set URLs that live in /public/leaflet
  // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png', // optional but nice
    shadowUrl: '/leaflet/marker-shadow.png',
  });
}
