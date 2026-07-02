import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Clock, MapPin, Star, Phone, Hammer } from 'lucide-react';
import { MapView, type MapViewHandle, type MapMarker } from '../components/MapView';
import { Button } from '../components/Button';
import { getDirections } from '../utils/mapbox';
import { formatDistance, formatDuration, interpolateCoords, interpolateAlongRoute, type Coords } from '../utils/geo';
import { getSocket } from '../utils/socket';

const LAHORE_CENTER: Coords = [74.3587, 31.5204];
const LAHORE_LABORER: Coords = [74.3387, 31.5054];

const SIMULATION_STEPS = 80;
const STEP_INTERVAL_MS = 350;
const SOCKET_TIMEOUT_MS = 5000;

type TrackingPhase = 'connecting' | 'tracking' | 'arrived' | 'working' | 'completed';

export function LiveTrackingScreen() {
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const mapRef = useRef<MapViewHandle>(null);

  const stateData = routerLocation.state as {
    worker?: { _id?: string; name?: string; rating?: number; pricePerHour?: number; phoneNumber?: string };
    clientCoords?: Coords;
    laborerCoords?: Coords;
    jobId?: string;
  } | null;

  const worker = stateData?.worker ?? { _id: undefined, name: 'Alex Johnson', rating: 4.8, pricePerHour: 25 };
  const workerId = worker._id;
  const clientCoords: Coords = stateData?.clientCoords ?? LAHORE_CENTER;
  const laborerInitial: Coords = stateData?.laborerCoords ?? LAHORE_LABORER;
  const jobId = stateData?.jobId;

  const [phase, setPhase] = useState<TrackingPhase>('connecting');
  const [laborerCoords, setLaborerCoords] = useState<Coords>(laborerInitial);
  const [route, setRoute] = useState<Coords[] | null>(null);
  const [eta, setEta] = useState<string | null>(null);
  const [distanceLabel, setDistanceLabel] = useState<string | null>(null);
  const [mode] = useState<'driving' | 'walking'>('driving');
  const [usingSocket, setUsingSocket] = useState(false);
  const [arrivalRequested, setArrivalRequested] = useState(false);
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);

  const stepRef = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const initialRouteRef = useRef<Coords[] | null>(null);

  const markers: MapMarker[] = [
    { id: 'client', coordinates: clientCoords, type: 'client' },
    { id: 'laborer', coordinates: laborerCoords, type: 'laborer' },
  ];

  const fetchRoute = useCallback(
    async (from: Coords) => {
      const result = await getDirections(from, clientCoords, mode);
      if (result) {
        setRoute(result.coordinates);
        setEta(formatDuration(result.duration));
        setDistanceLabel(formatDistance(result.distance));
        if (!initialRouteRef.current) initialRouteRef.current = result.coordinates;
      }
    },
    [clientCoords, mode]
  );

  const startSimulation = useCallback(() => {
    if (intervalRef.current) return;
    stepRef.current = 0;

    intervalRef.current = setInterval(() => {
      stepRef.current += 1;
      const t = stepRef.current / SIMULATION_STEPS;

      if (t >= 1) {
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        setLaborerCoords(clientCoords);
        mapRef.current?.updateMarkerPosition('laborer', clientCoords);
        setEta('Arrived!');
        setDistanceLabel('0 m');
        setPhase('arrived');
        return;
      }

      const next = initialRouteRef.current && initialRouteRef.current.length > 1
        ? interpolateAlongRoute(initialRouteRef.current, t)
        : interpolateCoords(laborerInitial, clientCoords, t);
      setLaborerCoords(next);
      mapRef.current?.updateMarkerPosition('laborer', next);

      if (stepRef.current % 12 === 0) fetchRoute(next);
    }, STEP_INTERVAL_MS);
  }, [laborerInitial, clientCoords, fetchRoute]);

  // Socket: location updates + work status events
  useEffect(() => {
    const socket = getSocket();

    if (jobId) {
      socket.emit('watch_job', jobId);
    }

    let receivedFirstUpdate = false;

    const fallbackTimer = setTimeout(() => {
      if (!receivedFirstUpdate) {
        setPhase('tracking');
        startSimulation();
      }
    }, SOCKET_TIMEOUT_MS);

    const handleLocationUpdate = ({ latitude, longitude }: { latitude: number; longitude: number }) => {
      const next: Coords = [longitude, latitude];
      receivedFirstUpdate = true;
      clearTimeout(fallbackTimer);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      setUsingSocket(true);
      setLaborerCoords(next);
      mapRef.current?.updateMarkerPosition('laborer', next);
      fetchRoute(next);
      setPhase('tracking');

      const dx = (next[0] - clientCoords[0]) * 111320 * Math.cos((clientCoords[1] * Math.PI) / 180);
      const dy = (next[1] - clientCoords[1]) * 110540;
      if (Math.sqrt(dx * dx + dy * dy) < 100) {
        setEta('Arrived!');
        setDistanceLabel('0 m');
        setPhase('arrived');
      }
    };

    const handleWorkStarted = () => {
      setPhase('working');
    };

    const handleWorkerArrived = (payload: { workerId?: string; jobId?: string }) => {
      if (jobId && payload.jobId && payload.jobId !== jobId) return;
      if (workerId && payload.workerId && payload.workerId !== workerId) return;
      setArrivalRequested(true);
      setPhase('arrived');
      setEta('Arrived!');
      setDistanceLabel('0 m');
    };

    const handleWorkCompleted = () => {
      setPhase('completed');
      setTimeout(() => {
        navigate('/payment', {
          state: { worker, jobId },
        });
      }, 1500);
    };

    socket.on('location_update', handleLocationUpdate);
    socket.on('worker_arrived_destination', handleWorkerArrived);
    socket.on('work_started', handleWorkStarted);
    socket.on('work_completed', handleWorkCompleted);

    return () => {
      clearTimeout(fallbackTimer);
      socket.off('location_update', handleLocationUpdate);
      socket.off('worker_arrived_destination', handleWorkerArrived);
      socket.off('work_started', handleWorkStarted);
      socket.off('work_completed', handleWorkCompleted);
    };
  }, [jobId, clientCoords, fetchRoute, startSimulation, navigate, worker, workerId]);

  // On mount: initial route + camera fit + no-jobId simulation
  useEffect(() => {
    fetchRoute(laborerInitial);

    const fitTimer = setTimeout(() => {
      const midLng = (laborerInitial[0] + clientCoords[0]) / 2;
      const midLat = (laborerInitial[1] + clientCoords[1]) / 2;
      mapRef.current?.flyTo([midLng, midLat], 13);
    }, 800);

    if (!jobId) {
      const connectTimer = setTimeout(() => {
        setPhase('tracking');
        startSimulation();
      }, 2000);
      return () => {
        clearTimeout(fitTimer);
        clearTimeout(connectTimer);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }

    return () => {
      clearTimeout(fitTimer);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isActiveWork = phase === 'working' || phase === 'completed';

  const handleConfirmArrival = () => {
    if (!workerId) return;
    getSocket().emit('destination_confirmed', {
      workerId,
      clientId: localStorage.getItem('userId') ?? '',
      jobId,
    });
    setArrivalConfirmed(true);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#0B1C2C]">

      {/* Full-screen map — dimmed when work is active */}
      <MapView
        ref={mapRef}
        centerCoords={[
          (laborerInitial[0] + clientCoords[0]) / 2,
          (laborerInitial[1] + clientCoords[1]) / 2,
        ]}
        zoom={13}
        markers={markers}
        route={route}
        mapStyle="dark"
        showCenterMe={false}
        className={`absolute inset-0 transition-opacity duration-700 ${isActiveWork ? 'opacity-20' : 'opacity-100'}`}
      />

      {/* "Work in Progress" overlay when worker is working */}
      <AnimatePresence>
        {isActiveWork && (
          <motion.div
            key="working-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-20 px-8"
          >
            <motion.div
              animate={phase === 'working' ? { scale: [1, 1.08, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-28 h-28 rounded-full bg-[#F4C430]/20 border-4 border-[#F4C430]/40 flex items-center justify-center mb-6"
            >
              {phase === 'completed' ? (
                <span className="text-5xl">✅</span>
              ) : (
                <Hammer size={48} className="text-[#F4C430]" />
              )}
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {phase === 'completed' ? 'Work Complete!' : 'Work in Progress'}
            </h2>
            <p className="text-white/60 text-center">
              {phase === 'completed'
                ? 'Redirecting to payment…'
                : `${worker.name} is working at your location`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-0 left-0 right-0 z-10 px-4 pt-10 pb-4"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-[#0B1C2C]/80 border border-white/20 flex items-center justify-center backdrop-blur-sm"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>

          <div className="flex-1 bg-[#0B1C2C]/80 border border-white/10 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
            <AnimatePresence mode="wait">
              {phase === 'connecting' && (
                <motion.div key="connecting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs text-[#F4C430] font-medium">● Connecting</p>
                  <p className="text-sm font-semibold text-white">Finding your worker…</p>
                </motion.div>
              )}
              {phase === 'tracking' && (
                <motion.div key="tracking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs text-[#F4C430] font-medium">
                    {usingSocket ? '● Live' : '● Simulated'}
                  </p>
                  <p className="text-sm font-semibold text-white">Worker is on the way</p>
                </motion.div>
              )}
              {phase === 'arrived' && (
                <motion.div key="arrived" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs text-green-400 font-medium">✓ Arrived</p>
                  <p className="text-sm font-semibold text-white">Worker is here!</p>
                </motion.div>
              )}
              {phase === 'working' && (
                <motion.div key="working" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs text-[#F4C430] font-medium">● In Progress</p>
                  <p className="text-sm font-semibold text-white">Work has started</p>
                </motion.div>
              )}
              {phase === 'completed' && (
                <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <p className="text-xs text-green-400 font-medium">✓ Done</p>
                  <p className="text-sm font-semibold text-white">Work complete!</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* ETA pill — only while tracking */}
      <AnimatePresence>
        {phase === 'tracking' && eta && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-52 left-1/2 -translate-x-1/2 z-10"
          >
            <div className="flex items-center gap-4 bg-[#0B1C2C]/90 border border-white/15 rounded-2xl px-5 py-3 backdrop-blur-sm shadow-xl">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-[#F4C430]" />
                <div>
                  <p className="text-[10px] text-white/50 leading-none">ETA</p>
                  <p className="text-sm font-bold text-white leading-tight">{eta}</p>
                </div>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="flex items-center gap-2">
                <MapPin size={15} className="text-[#F4C430]" />
                <div>
                  <p className="text-[10px] text-white/50 leading-none">Distance</p>
                  <p className="text-sm font-bold text-white leading-tight">{distanceLabel ?? '—'}</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom panel — hidden when work overlay is showing */}
      <AnimatePresence>
        {!isActiveWork && (
          <motion.div
            key="bottom-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 260, damping: 28, delay: 0.4 }}
            className="absolute bottom-0 left-0 right-0 z-10 rounded-t-3xl bg-[#0D1F30] border-t border-white/10 px-5 pt-4 pb-8 shadow-2xl"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-5" />

            {/* Worker info */}
            <div className="mb-5">
              <div className="flex items-center gap-4 mb-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-2xl shrink-0">
                  👷
                </div>
                <div className="flex-1">
                  <p className="text-base font-bold text-white">{worker.name}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Star size={12} className="text-[#F4C430] fill-[#F4C430]" />
                    <span className="text-sm text-white/70">{worker.rating}</span>
                    <span className="text-white/30 text-sm">·</span>
                    <span className="text-sm text-white/50">Rs {worker.pricePerHour}/hr</span>
                  </div>
                </div>
              </div>

              {/* Phone / WhatsApp row */}
              {worker.phoneNumber ? (
                <a
                  href={`https://wa.me/${(worker.phoneNumber as string).replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/25"
                >
                  <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                    <Phone size={15} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-white/40 leading-none mb-0.5">Worker's Phone</p>
                    <p className="text-sm font-semibold text-green-400">{worker.phoneNumber as string}</p>
                  </div>
                  <span className="text-xs text-green-400/70 font-medium">WhatsApp →</span>
                </a>
              ) : (
                <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                  <Phone size={15} className="text-white/30" />
                  <span className="text-sm text-white/30">Phone not available</span>
                </div>
              )}
            </div>

            {/* Phase status strip */}
            <AnimatePresence mode="wait">
              {phase === 'connecting' && (
                <motion.div
                  key="conn-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-3 py-3 bg-[#F4C430]/10 border border-[#F4C430]/20 rounded-2xl"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-4 h-4 border-2 border-[#F4C430] border-t-transparent rounded-full"
                  />
                  <span className="text-sm text-[#F4C430] font-medium">Confirming booking…</span>
                </motion.div>
              )}

              {phase === 'tracking' && (
                <motion.div
                  key="track-content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-3 py-3 px-4 bg-white/5 border border-white/10 rounded-2xl"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="w-2.5 h-2.5 rounded-full bg-green-400 shrink-0"
                  />
                  <span className="text-sm text-white/80">
                    {worker.name} is heading to your location
                  </span>
                </motion.div>
              )}

              {phase === 'arrived' && (
                <motion.div
                  key="arrived-content"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-3 py-4 px-4 bg-green-500/10 border border-green-500/30 rounded-2xl">
                  <span className="text-xl">🎉</span>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {arrivalRequested ? `${worker.name} says they have arrived` : `${worker.name} is near your location`}
                    </p>
                    <p className="text-xs text-white/50">
                      {arrivalConfirmed
                        ? 'Arrival confirmed. Work can begin.'
                        : 'Confirm only after you see the worker at your destination.'}
                    </p>
                  </div>
                  </div>
                  {arrivalRequested && (
                    <Button
                      variant="primary"
                      fullWidth
                      onClick={handleConfirmArrival}
                      disabled={arrivalConfirmed || !workerId}
                    >
                      {arrivalConfirmed ? 'Arrival Confirmed' : 'Yes, Worker Has Reached'}
                    </Button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
