import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { API_URL } from '../utils/api';
import { motion } from 'motion/react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ArrowLeft, Locate, List } from 'lucide-react';
import { JobBottomSheet, type JobFeature } from '../components/JobMarkers';
import type { Coords } from '../utils/geo';
import { Geolocation } from '@capacitor/geolocation';

const _P1 = 'pk.eyJ1Ijoia2VuZWtpMjEyIiwiYSI6ImNtcHh5dTQ4';
const _P2 = 'eTAwczkycHM1d3YwdHRiczcifQ.AoIkyGi1m8DgFpyydR7IyA';
mapboxgl.accessToken = _P1 + _P2;

const DEFAULT_CENTER: Coords = [74.3587, 31.5204];

// Cluster layer paint config
const CLUSTER_COLORS = ['#F4C430', '#E8B800', '#D4A800'];

export function JobMapScreen() {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [jobs, setJobs] = useState<JobFeature[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobFeature | null>(null);
  const [userCoords, setUserCoords] = useState<Coords | null>(null);

  // Fetch jobs from backend
  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_URL}/api/jobs`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: Array<{ _id: string; title: string; category?: string; price?: number; location?: { coordinates: Coords }; creatorId?: { name?: string } }>) => {
        if (Array.isArray(data)) {
          setJobs(
            data.map((j) => ({
              id: j._id,
              title: j.title,
              category: j.category,
              price: j.price,
              coordinates: (j.location?.coordinates ?? DEFAULT_CENTER) as Coords,
              creatorName: j.creatorId?.name,
            }))
          );
        }
      })
      .catch((err) => console.error("Failed to fetch jobs for map", err));
  }, []);

  // Build map once
  useEffect(() => {
    if (!containerRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: 12,
      attributionControl: false,
    });
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Add/update clustering source when jobs change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || jobs.length === 0) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: jobs.map((j) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: j.coordinates },
        properties: { id: j.id, title: j.title, category: j.category ?? '', price: j.price ?? 0, creatorName: j.creatorName ?? '' },
      })),
    };

    const applyLayers = () => {
      // Clean up previous
      ['laborify-clusters', 'laborify-cluster-count', 'laborify-unclustered'].forEach((id) => {
        if (map.getLayer(id)) map.removeLayer(id);
      });
      if (map.getSource('laborify-jobs')) map.removeSource('laborify-jobs');

      map.addSource('laborify-jobs', {
        type: 'geojson',
        data: geojson,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      });

      // Cluster circles
      map.addLayer({
        id: 'laborify-clusters',
        type: 'circle',
        source: 'laborify-jobs',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            CLUSTER_COLORS[0], 5, CLUSTER_COLORS[1], 10, CLUSTER_COLORS[2],
          ],
          'circle-radius': ['step', ['get', 'point_count'], 22, 5, 30, 10, 38],
          'circle-opacity': 0.9,
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.25)',
        },
      });

      // Cluster count label
      map.addLayer({
        id: 'laborify-cluster-count',
        type: 'symbol',
        source: 'laborify-jobs',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': 13,
        },
        paint: { 'text-color': '#0B1C2C' },
      });

      // Individual job markers
      map.addLayer({
        id: 'laborify-unclustered',
        type: 'circle',
        source: 'laborify-jobs',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': '#F4C430',
          'circle-radius': 14,
          'circle-stroke-width': 3,
          'circle-stroke-color': 'rgba(255,255,255,0.8)',
        },
      });

      // Cluster click → zoom in
      map.on('click', 'laborify-clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['laborify-clusters'] });
        const clusterId = features[0].properties?.cluster_id as number;
        (map.getSource('laborify-jobs') as mapboxgl.GeoJSONSource).getClusterExpansionZoom(
          clusterId,
          (err, zoom) => {
            if (err) return;
            const coords = (features[0].geometry as GeoJSON.Point).coordinates as [number, number];
            map.easeTo({ center: coords, zoom: zoom ?? 14 });
          }
        );
      });

      // Individual marker click → bottom sheet
      map.on('click', 'laborify-unclustered', (e) => {
        const props = e.features?.[0]?.properties;
        const coords = (e.features?.[0]?.geometry as GeoJSON.Point)?.coordinates as Coords;
        if (!props || !coords) return;
        setSelectedJob({
          id: props.id,
          title: props.title,
          category: props.category,
          price: props.price,
          coordinates: coords,
          creatorName: props.creatorName,
        });
      });

      // Pointer cursors
      map.on('mouseenter', 'laborify-clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'laborify-clusters', () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', 'laborify-unclustered', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'laborify-unclustered', () => { map.getCanvas().style.cursor = ''; });
    };

    if (map.isStyleLoaded()) {
      applyLayers();
    } else {
      map.once('load', applyLayers);
    }
  }, [jobs]);

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
      {/* Map */}
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
          <p className="text-xs text-white/50">Showing</p>
          <p className="text-sm font-semibold text-white">{jobs.length} nearby jobs</p>
        </div>
        <button
          onClick={() => navigate('/labor-dashboard')}
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
      <div className="absolute inset-x-0 bottom-0 z-20">
        <JobBottomSheet
          job={selectedJob}
          userCoords={userCoords}
          onClose={() => setSelectedJob(null)}
          onViewDetails={(job) =>
            navigate('/job-request', { state: { job: { _id: job.id, title: job.title, price: job.price, category: job.category } } })
          }
        />
      </div>
    </div>
  );
}
