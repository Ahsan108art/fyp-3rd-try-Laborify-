import type { Coords } from './geo';

const _P1 = 'pk.eyJ1Ijoia2VuZWtpMjEyIiwiYSI6ImNtcHh5dTQ4';
const _P2 = 'eTAwczkycHM1d3YwdHRiczcifQ.AoIkyGi1m8DgFpyydR7IyA';
const TOKEN = _P1 + _P2;
const BASE = 'https://api.mapbox.com';

export interface DirectionsResult {
  coordinates: Coords[];
  duration: number;  // seconds
  distance: number;  // meters
}

export async function getDirections(
  origin: Coords,
  destination: Coords,
  mode: 'driving' | 'walking' = 'driving'
): Promise<DirectionsResult | null> {
  try {
    const url =
      `${BASE}/directions/v5/mapbox/${mode}/` +
      `${origin[0]},${origin[1]};${destination[0]},${destination[1]}` +
      `?geometries=geojson&overview=full&access_token=${TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data.routes?.[0];
    if (!route) return null;
    return {
      coordinates: route.geometry.coordinates as Coords[],
      duration: route.duration,
      distance: route.distance,
    };
  } catch {
    return null;
  }
}

export interface GeocodeSuggestion {
  id: string;
  place_name: string;
  center: Coords;
}

export interface GeocodeData {
  city: string;
  area: string;
  formatted: string;
}

export async function getGeocodeData(coords: Coords): Promise<GeocodeData> {
  try {
    const [lng, lat] = coords;

    // Fire both requests concurrently for maximum speed
    const mapboxPromise = fetch(`${BASE}/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${TOKEN}&language=en`).then(r => r.json());
    const osmPromise = fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, { headers: { 'User-Agent': 'LaborifyApp/1.0' } }).then(r => r.json());

    const [mapboxRes, osmRes] = await Promise.allSettled([mapboxPromise, osmPromise]);

    let finalArea = "Unknown Area";
    let finalCity = "Unknown City";

    // 1. Extract City from Mapbox (Most reliable macro-level)
    if (mapboxRes.status === 'fulfilled' && mapboxRes.value.features?.length > 0) {
      const top = mapboxRes.value.features[0];
      const context = top.context || [];
      const cityObj = context.find((c: any) => c.id.startsWith('place.')) 
                   || context.find((c: any) => c.id.startsWith('district.'))
                   || mapboxRes.value.features.find((f: any) => f.id.startsWith('place.'));
      if (cityObj) finalCity = cityObj.text;
      
      // Fallback area if OSM fails
      if (top.text) finalArea = top.text;
    }

    // 2. Extract Area from OpenStreetMap (Most reliable micro-level in Pakistan)
    if (osmRes.status === 'fulfilled' && osmRes.value.address) {
      const addr = osmRes.value.address;
      // Intelligently pick the most specific local name
      const exactArea = addr.neighbourhood || addr.suburb || addr.village || addr.road || addr.residential;
      if (exactArea) {
        finalArea = exactArea;
      } else if (osmRes.value.display_name) {
        // Fallback to the first segment of the display name
        finalArea = osmRes.value.display_name.split(',')[0].trim();
      }
    }

    const exactName = `${finalArea}, ${finalCity}`;
    const formatted =
      finalArea === "Unknown Area" && finalCity === "Unknown City"
        ? `${lat.toFixed(5)}, ${lng.toFixed(5)}`
        : exactName;

    return { city: finalCity, area: finalArea, formatted };
  } catch {
    return { city: "Unknown City", area: "Unknown Area", formatted: `${coords[1].toFixed(5)}, ${coords[0].toFixed(5)}` };
  }
}

export async function reverseGeocode(coords: Coords): Promise<string> {
  const data = await getGeocodeData(coords);
  return data.formatted;
}

export async function forwardGeocode(query: string): Promise<GeocodeSuggestion[]> {
  if (query.trim().length < 2) return [];
  try {
    const url =
      `${BASE}/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json` +
      `?autocomplete=true&limit=5&access_token=${TOKEN}`;
    const res = await fetch(url);
    const data = await res.json();
    return (data.features ?? []).map((f: Record<string, unknown>) => ({
      id: f.id as string,
      place_name: f.place_name as string,
      center: f.center as Coords,
    }));
  } catch {
    return [];
  }
}
