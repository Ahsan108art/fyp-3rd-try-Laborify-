export type Coords = [number, number]; // [longitude, latitude]

export function haversineDistance(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(deg: number) {
  return (deg * Math.PI) / 180;
}

export function formatDistance(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export function openNativeMaps(coords: Coords, label = 'Destination'): void {
  const [lng, lat] = coords;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const encoded = encodeURIComponent(label);
  if (isIOS) {
    window.open(`maps://?daddr=${lat},${lng}&q=${encoded}`, '_blank');
  } else {
    window.open(
      `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encoded}`,
      '_blank'
    );
  }
}

export function interpolateCoords(a: Coords, b: Coords, t: number): Coords {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function interpolateAlongRoute(route: Coords[], t: number): Coords {
  if (route.length === 0) return [0, 0];
  if (route.length === 1) return route[0];
  if (t <= 0) return route[0];
  if (t >= 1) return route[route.length - 1];

  let totalDist = 0;
  const segLengths: number[] = [];
  for (let i = 0; i < route.length - 1; i++) {
    const d = haversineDistance(route[i], route[i + 1]);
    segLengths.push(d);
    totalDist += d;
  }

  if (totalDist === 0) return route[0];

  const targetDist = t * totalDist;
  let accumulated = 0;

  for (let i = 0; i < segLengths.length; i++) {
    if (accumulated + segLengths[i] >= targetDist) {
      const segT = segLengths[i] > 0 ? (targetDist - accumulated) / segLengths[i] : 0;
      return interpolateCoords(route[i], route[i + 1], segT);
    }
    accumulated += segLengths[i];
  }

  return route[route.length - 1];
}
