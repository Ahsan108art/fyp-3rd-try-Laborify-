import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { API_URL } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, Locate, List, MapPin, X, Star } from 'lucide-react';
import type { Coords } from '../utils/geo';
import { Button } from '../components/Button';
import { WorkerCard } from '../components/WorkerCard';
import { Geolocation } from '@capacitor/geolocation';
import { getSocket } from '../utils/socket';

const _P1 = 'pk.eyJ1Ijoia2VuZWtpMjEyIiwiYSI6ImNtcHh5dTQ4';
const _P2 = 'eTAwczkycHM1d3YwdHRiczcifQ.AoIkyGi1m8DgFpyydR7IyA';
mapboxgl.accessToken = _P1 + _P2;

const DEFAULT_CENTER: Coords = [74.3587, 31.5204];

interface WorkerFeature {
  id: string;
  name: string;
  rating: number;
  skills: string[];
  chargePerHour: number;
  status: string;
  isOnline: boolean;
  jobsCompleted: number;
  coordinates: Coords;
  distance: string;
  distanceMeters: number | null;
  phoneNumber?: string;
  profileImage?: string;
}

export function WorkerMapScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [workers, setWorkers] = useState<WorkerFeature[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<WorkerFeature | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);

  const category = (state as any)?.category || '';

  // Fetch workers
  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedCoords = localStorage.getItem('userCoords');
        const coords: [number, number] | null =
          (state as any)?.location ?? (savedCoords ? JSON.parse(savedCoords) : null);

        if (coords) setUserCoords(coords);

        const params = new URLSearchParams();
        if (coords) {
          params.set('lat', String(coords[1]));
          params.set('lng', String(coords[0]));
          params.set('radius', '20');
        }
        if (category) params.set('category', category);

        const res = await fetch(`${API_URL}/api/workers/nearby?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const data = await res.json();
          const mapped = data
            .filter((w: any) => w.status === 'available' && w.isOnline && w.distanceMeters !== null && w.location?.coordinates && w.location.coordinates[0] !== 0)
            .map((w: any) => ({
              id: w._id,
              name: w.name,
              rating: w.rating,
              skills: w.skills,
              chargePerHour: w.chargePerHour,
              status: w.status,
              isOnline: w.isOnline,
              jobsCompleted: w.jobsCompleted,
              coordinates: w.location.coordinates as Coords,
              distance: w.distance,
              distanceMeters: w.distanceMeters,
              phoneNumber: w.phoneNumber,
              profileImage: w.profileImage,
            }));
          setWorkers(mapped);
        }
      } catch (err) {
        console.error('Failed to fetch workers for map', err);
      }
    };
    fetchWorkers();
  }, [category, state]);

  // Listen for real-time worker status changes
  useEffect(() => {
    const socket = getSocket();
    const handleStatusChanged = ({ workerId, status, isOnline }: { workerId: string; status: string; isOnline: boolean }) => {
      if (status !== 'available' || !isOnline) {
        setWorkers((prev) => prev.filter((w) => w.id !== workerId));
        setSelectedWorker((prev) => (prev?.id === workerId ? null : prev));
      }
    };

    socket.on('worker_status_changed', handleStatusChanged);
    return () => {
      socket.off('worker_status_changed', handleStatusChanged);
    };
  }, []);

  // Build map once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: userCoords || DEFAULT_CENTER,
      zoom: 12,
      attributionControl: false,
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Map markers & layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || workers.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: workers.map((w) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: w.coordinates },
        properties: { id: w.id },
      })),
    };

    const applyLayers = () => {
      if (map.getLayer('laborify-workers-pulse')) map.removeLayer('laborify-workers-pulse');
      if (map.getLayer('laborify-workers')) map.removeLayer('laborify-workers');
      if (map.getSource('laborify-workers-source')) map.removeSource('laborify-workers-source');

      map.addSource('laborify-workers-source', {
        type: 'geojson',
        data: geojson,
      });

      // Outer pulse ring
      map.addLayer({
        id: 'laborify-workers-pulse',
        type: 'circle',
        source: 'laborify-workers-source',
        paint: {
          'circle-color': '#50C878',
          'circle-radius': 20,
          'circle-opacity': 0.3,
          'circle-blur': 0.5,
        },
      });

      // Inner dot
      map.addLayer({
        id: 'laborify-workers',
        type: 'circle',
        source: 'laborify-workers-source',
        paint: {
          'circle-color': '#50C878',
          'circle-radius': 8,
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.8)',
        },
      });

      map.on('click', 'laborify-workers', (e) => {
        const id = e.features?.[0]?.properties?.id;
        const worker = workers.find((w) => w.id === id);
        if (worker) setSelectedWorker(worker);
      });

      map.on('mouseenter', 'laborify-workers', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'laborify-workers', () => { map.getCanvas().style.cursor = ''; });
    };

    if (map.isStyleLoaded()) {
      applyLayers();
    } else {
      map.once('load', applyLayers);
    }
  }, [workers]);

  // Center on user coords + job pin if available
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const jobCoords = (state as any)?.location as [number, number] | undefined;
    
    // Add job pin if we have it
    if (jobCoords) {
      if (!map.getSource('job-pin')) {
        map.addSource('job-pin', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'Point', coordinates: jobCoords }, properties: {} }
        });
        map.addLayer({
          id: 'job-pin',
          type: 'circle',
          source: 'job-pin',
          paint: {
            'circle-color': '#FF3B30',
            'circle-radius': 10,
            'circle-stroke-width': 3,
            'circle-stroke-color': 'rgba(255,255,255,0.8)',
          }
        });
      }
    }
  }, [state, workers]);

  const handleCenterMe = useCallback(async () => {
    try {
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') return;
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const coords: Coords = [pos.coords.longitude, pos.coords.latitude];
      setUserCoords(coords);
      mapRef.current?.flyTo({ center: coords, zoom: 14, duration: 800 });
    } catch (e) {
      console.error('Failed to get location', e);
    }
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0B1C2C]">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 px-4 pt-8 pb-3 flex items-center gap-3"
      >
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl bg-[#0B1C2C]/80 border border-white/20 flex items-center justify-center backdrop-blur-sm"
        >
          <ArrowLeft size={18} className="text-white" />
        </button>
        <div className="flex-1 bg-[#0B1C2C]/80 border border-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
          <p className="text-xs text-white/50">Workers Nearby</p>
          <p className="text-sm font-semibold text-white">{workers.length} {category ? category : 'total'} workers found</p>
        </div>
        <button
          onClick={() => navigate('/choose-worker', { state })}
          className="w-10 h-10 rounded-2xl bg-[#0B1C2C]/80 border border-white/20 flex items-center justify-center backdrop-blur-sm"
          title="List view"
        >
          <List size={18} className="text-white" />
        </button>
      </motion.div>

      {/* Center-me button */}
      <button
        onClick={handleCenterMe}
        className="absolute bottom-36 right-4 z-10 w-12 h-12 rounded-2xl bg-[#0B1C2C]/90 border border-white/20 flex items-center justify-center shadow-xl backdrop-blur-sm"
      >
        <Locate size={20} className="text-[#F4C430]" />
      </button>

      {/* Bottom sheet */}
      <AnimatePresence>
        {selectedWorker && (
          <motion.div
            key={selectedWorker.id}
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl bg-[#112233] border-t border-white/10 p-5 shadow-2xl"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />
            <button
              onClick={() => setSelectedWorker(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
            >
              <X size={14} className="text-white" />
            </button>

            <WorkerCard
              name={selectedWorker.name}
              rating={selectedWorker.rating}
              distance={selectedWorker.distance}
              pricePerHour={selectedWorker.chargePerHour}
              skills={selectedWorker.skills}
              image={selectedWorker.profileImage}
              status={selectedWorker.status}
              isOnline={selectedWorker.isOnline}
              jobsCompleted={selectedWorker.jobsCompleted}
              onAccept={() =>
                navigate("/confirm-booking", {
                  state: {
                    worker: {
                      _id: selectedWorker.id,
                      name: selectedWorker.name,
                      rating: selectedWorker.rating,
                      distance: selectedWorker.distance,
                      pricePerHour: selectedWorker.chargePerHour,
                      skills: selectedWorker.skills,
                      phoneNumber: selectedWorker.phoneNumber,
                      jobsCompleted: selectedWorker.jobsCompleted,
                      status: selectedWorker.status,
                      location: { type: 'Point', coordinates: selectedWorker.coordinates },
                    },
                    jobId: (state as any)?.jobId,
                    address: (state as any)?.address,
                    description: (state as any)?.description,
                    category: (state as any)?.category,
                  },
                })
              }
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
