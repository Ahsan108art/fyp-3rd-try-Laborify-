import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Locate } from 'lucide-react';
import type { Coords } from '../utils/geo';
import { Geolocation } from '@capacitor/geolocation';

const _P1 = 'pk.eyJ1Ijoia2VuZWtpMjEyIiwiYSI6ImNtcHh5dTQ4';
const _P2 = 'eTAwczkycHM1d3YwdHRiczcifQ.AoIkyGi1m8DgFpyydR7IyA';
mapboxgl.accessToken = _P1 + _P2;

const DEFAULT_CENTER: Coords = [74.3587, 31.5204]; // Lahore

export type MarkerType = 'job' | 'client' | 'laborer' | 'pin';

export interface MapMarker {
  id: string;
  coordinates: Coords;
  type: MarkerType;
  pulse?: boolean;
  data?: Record<string, unknown>;
}

export interface MapViewHandle {
  updateMarkerPosition: (id: string, coords: Coords) => void;
  flyTo: (coords: Coords, zoom?: number) => void;
}

interface MapViewProps {
  centerCoords?: Coords;
  zoom?: number;
  markers?: MapMarker[];
  route?: Coords[] | null;
  onMapClick?: (coords: Coords) => void;
  onMarkerClick?: (marker: MapMarker) => void;
  mapStyle?: 'dark' | 'light';
  /** Controls sizing & positioning of the outer shell (e.g. "h-60", "absolute inset-0"). */
  className?: string;
  showCenterMe?: boolean;
}

const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/streets-v12',
};

const MARKER_EMOJI: Record<MarkerType, string> = {
  job: '💼', client: '🏠', laborer: '👷', pin: '📍',
};
const MARKER_COLOR: Record<MarkerType, string> = {
  job: '#F4C430', client: '#4A90E2', laborer: '#50C878', pin: '#FF6B6B',
};

function buildMarkerEl(m: MapMarker): HTMLDivElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:40px;height:40px;';

  if (m.pulse) {
    const ring = document.createElement('div');
    ring.style.cssText = `
      position:absolute;inset:0;border-radius:50%;
      background:${MARKER_COLOR[m.type]}55;
      animation:laborify-ping 1.6s ease-out infinite;
    `;
    wrapper.appendChild(ring);
  }

  const pin = document.createElement('div');
  pin.style.cssText = `
    position:absolute;inset:4px;border-radius:50%;
    background:${MARKER_COLOR[m.type]};
    border:3px solid rgba(255,255,255,0.9);
    display:flex;align-items:center;justify-content:center;
    font-size:14px;cursor:pointer;
    box-shadow:0 2px 12px rgba(0,0,0,0.45);
  `;
  pin.textContent = MARKER_EMOJI[m.type];
  wrapper.appendChild(pin);
  return wrapper;
}

if (typeof document !== 'undefined' && !document.getElementById('laborify-map-styles')) {
  const s = document.createElement('style');
  s.id = 'laborify-map-styles';
  s.textContent = `@keyframes laborify-ping {
    0%   { transform:scale(1); opacity:.75; }
    100% { transform:scale(2.8); opacity:0; }
  }`;
  document.head.appendChild(s);
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    centerCoords = DEFAULT_CENTER,
    zoom = 13,
    markers = [],
    route = null,
    onMapClick,
    onMarkerClick,
    mapStyle = 'dark',
    className = '',
    showCenterMe = true,
  },
  ref
) {
  // containerRef is the actual Mapbox GL container — always uses inline styles
  // so there is ZERO conflict with Tailwind classes on the outer shell div.
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerDOMRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const onMapClickRef = useRef(onMapClick);
  const onMarkerClickRef = useRef(onMarkerClick);
  useEffect(() => { onMapClickRef.current = onMapClick; }, [onMapClick]);
  useEffect(() => { onMarkerClickRef.current = onMarkerClick; }, [onMarkerClick]);

  useImperativeHandle(ref, () => ({
    updateMarkerPosition(id, coords) {
      markerDOMRef.current.get(id)?.setLngLat(coords);
    },
    flyTo(coords, z = 14) {
      mapRef.current?.flyTo({ center: coords, zoom: z, duration: 700 });
    },
  }));

  // Initialize map after one animation frame (guarantees layout is painted)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let map: mapboxgl.Map;
    const raf = requestAnimationFrame(() => {
      map = new mapboxgl.Map({
        container: el,
        style: MAP_STYLES[mapStyle],
        center: centerCoords,
        zoom,
        attributionControl: false,
        logoPosition: 'bottom-left',
      });

      map.on('load', () => map.resize());
      map.on('click', (e) => {
        onMapClickRef.current?.([e.lngLat.lng, e.lngLat.lat]);
      });

      mapRef.current = map;

      // Ensure map resizes if the parent container's dimensions change due to animations
      const ro = new ResizeObserver(() => {
        map.resize();
      });
      ro.observe(el);
      
      // Store ro in a ref or simply add it to cleanup
      (map as any)._ro = ro;
    });

    return () => {
      cancelAnimationFrame(raf);
      if (mapRef.current) {
        const ro = (mapRef.current as any)._ro;
        if (ro) ro.disconnect();
      }
      markerDOMRef.current.forEach((m) => m.remove());
      markerDOMRef.current.clear();
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    mapRef.current?.setStyle(MAP_STYLES[mapStyle]);
  }, [mapStyle]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const incoming = new Set(markers.map((m) => m.id));
    markerDOMRef.current.forEach((marker, id) => {
      if (!incoming.has(id)) { marker.remove(); markerDOMRef.current.delete(id); }
    });

    markers.forEach((m) => {
      if (markerDOMRef.current.has(m.id)) {
        markerDOMRef.current.get(m.id)!.setLngLat(m.coordinates);
        return;
      }
      const el = buildMarkerEl(m);
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onMarkerClickRef.current?.(m);
      });
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat(m.coordinates)
        .addTo(map);
      markerDOMRef.current.set(m.id, marker);
    });
  }, [markers]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyRoute = () => {
      if (map.getLayer('laborify-route')) map.removeLayer('laborify-route');
      if (map.getSource('laborify-route')) map.removeSource('laborify-route');
      if (!route || route.length < 2) return;
      map.addSource('laborify-route', {
        type: 'geojson',
        data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: route } },
      });
      map.addLayer({
        id: 'laborify-route', type: 'line', source: 'laborify-route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#F4C430', 'line-width': 4, 'line-opacity': 0.9 },
      });
    };

    if (map.isStyleLoaded()) applyRoute();
    else map.once('styledata', applyRoute);
  }, [route]);

  const handleCenterMe = useCallback(async () => {
    try {
      let permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions();
      }
      
      if (permission.location !== 'granted') {
        alert("GPS Permission denied! Please enable location permissions in your Android settings.");
        return;
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;
      const coords: Coords = [longitude, latitude];
      mapRef.current?.flyTo({
        center: coords,
        zoom: 15, duration: 800,
      });
      onMapClickRef.current?.(coords);
    } catch (e) {
      // denied or error
    }
  }, []);

  return (
    /*
     * Outer shell — className controls WHERE the map lives (size, position, border-radius).
     * No Tailwind position classes here that could conflict with the shell.
     */
    <div className={className}>
      {/*
       * Inner wrapper — always relative via inline style so Mapbox's absolute canvas
       * has a reliable containing block regardless of what className says.
       */}
      <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
        {/* Mapbox GL container — inline styles only, zero Tailwind conflict */}
        <div
          ref={containerRef}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
        />

        {showCenterMe && (
          <button
            onClick={handleCenterMe}
            style={{ position: 'absolute', bottom: 16, right: 16, zIndex: 10 }}
            className="w-12 h-12 rounded-2xl bg-[#0B1C2C]/90 border border-white/20 flex items-center justify-center shadow-xl backdrop-blur-sm"
            aria-label="Center on my location"
          >
            <Locate size={20} className="text-[#F4C430]" />
          </button>
        )}
      </div>
    </div>
  );
});
