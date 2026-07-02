import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import { API_URL } from "../utils/api";
import { motion } from "motion/react";
import { WorkerCard } from "../components/WorkerCard";
import { Filter, ArrowLeft, Map } from "lucide-react";
import { getSocket } from "../utils/socket";

export function ChooseWorkerScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const token = localStorage.getItem("token");

        // Prefer coords passed via router state; fall back to localStorage cache
        const stateCoords = state?.location as [number, number] | null | undefined;
        const savedCoords = localStorage.getItem("userCoords");
        const coords: [number, number] | null =
          stateCoords ?? (savedCoords ? JSON.parse(savedCoords) : null);

        const category: string = state?.category ?? "";

        const params = new URLSearchParams();
        if (coords) {
          params.set("lat", String(coords[1]));
          params.set("lng", String(coords[0]));
          params.set("radius", "20");
        }
        if (category) params.set("category", category);

        const res = await fetch(`${API_URL}/api/workers/nearby?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        if (res.ok) {
          setWorkers(data.filter((w: any) => w.status === 'available' && w.isOnline && w.distanceMeters !== null));
        } else {
          setApiError(`API ${res.status}: ${data?.error ?? data?.message ?? JSON.stringify(data)}`);
        }
      } catch (err: any) {
        setApiError(err?.message ?? "Network error");
        console.error("Failed to fetch workers:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, []);

  // Listen for real-time worker status changes
  useEffect(() => {
    const socket = getSocket();

    const handleStatusChanged = ({ workerId, status, isOnline }: { workerId: string; status: string; isOnline: boolean }) => {
      setWorkers(prev => {
        if (status !== 'available' || !isOnline) {
          return prev.filter(w => w._id !== workerId);
        }
        return prev.map(w => w._id === workerId ? { ...w, status, isOnline } : w);
      });
    };

    socket.on('worker_status_changed', handleStatusChanged);
    return () => { socket.off('worker_status_changed', handleStatusChanged); };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white flex-1">Available Workers</h1>
          <button
            onClick={() => navigate('/worker-map', { state })}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F4C430]/10 border border-[#F4C430]/30 text-[#F4C430] text-xs font-medium"
          >
            <Map size={13} />
            Map
          </button>
          <button className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Filter size={18} className="text-white" />
          </button>
        </div>
        <p className="text-white/60 ml-13">
          {loading ? "Finding workers nearbyâ€¦" : `${workers.filter(w => w.status === 'available').length} available workers found`}
        </p>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-[#F4C430] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apiError ? (
        <div className="text-center py-20 px-4">
          <p className="text-red-400 font-medium mb-2">Error loading workers</p>
          <p className="text-sm text-white/50 break-all">{apiError}</p>
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/60">No workers found nearby.</p>
          <p className="text-sm text-white/40 mt-2">Try a different category or check back later.</p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {workers.map((worker, index) => (
            <motion.div
              key={worker._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <WorkerCard
                name={worker.name}
                rating={worker.rating}
                distance={worker.distance ?? "Unknown"}
                pricePerHour={worker.chargePerHour}
                skills={worker.skills}
                image={worker.profileImage || undefined}
                status={worker.status || 'available'}
                isOnline={worker.isOnline}
                jobsCompleted={worker.jobsCompleted}
                onAccept={() =>
                  navigate("/confirm-booking", {
                    state: {
                      worker: {
                        _id: worker._id,
                        name: worker.name,
                        rating: worker.rating,
                        distance: worker.distance,
                        pricePerHour: worker.chargePerHour,
                        skills: worker.skills,
                        phoneNumber: worker.phoneNumber,
                        jobsCompleted: worker.jobsCompleted,
                        status: worker.status,
                        location: worker.location,
                      },
                      jobId: state?.jobId,
                      address: state?.address,
                      description: state?.description,
                      category: state?.category,
                    },
                  })
                }
                onViewProfile={() => {}}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
