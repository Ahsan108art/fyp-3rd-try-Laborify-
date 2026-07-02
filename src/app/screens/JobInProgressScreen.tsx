import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { MapView, type MapMarker } from "../components/MapView";
import { Button } from "../components/Button";
import { CheckCircle, MapPin, Clock, Banknote, Phone } from "lucide-react";
import { getSocket } from "../utils/socket";
import { Geolocation } from "@capacitor/geolocation";
import type { Coords } from "../utils/geo";

export function JobInProgressScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const worker = state?.worker;
  const jobId: string | undefined = state?.jobId ?? state?.job?._id;
  const clientId: string = state?.clientId ?? "";
  const clientName: string = state?.job?.creatorId?.name ?? state?.clientName ?? "Client";
  const clientPhone: string = state?.clientPhone ?? "";
  const jobTitle: string = state?.job?.title ?? worker?.skills?.[0] ?? "Job";
  const jobAddress: string = state?.address ?? state?.job?.address ?? "On-site";
  const clientCoords: Coords | null = state?.clientCoords ?? state?.job?.location?.coordinates ?? null;
  const clientMarkers: MapMarker[] = clientCoords
    ? [{ id: "client-destination", coordinates: clientCoords, type: "client", pulse: true }]
    : [];
  const chargePerHour: number =
    worker?.pricePerHour ??
    (parseFloat(localStorage.getItem("chargePerHour") ?? "0") || 25);

  const [status, setStatus] = useState<"on-the-way" | "arrived" | "working" | "completed">(
    "on-the-way"
  );
  const [arrivalConfirmed, setArrivalConfirmed] = useState(false);
  const [elapsed, setElapsed] = useState(0); // seconds
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isLabor = localStorage.getItem("userRole") === "labor";
  const workerId = localStorage.getItem("userId") ?? "";

  // Live timer while working
  useEffect(() => {
    if (status !== "working") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  // Laborer broadcasts GPS while working
  useEffect(() => {
    if (!isLabor || status !== "working" || !jobId) return;

    const socket = getSocket();

    const broadcast = async () => {
      try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') return;
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        socket.emit("location_update", {
          jobId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      } catch (err) {
        console.error("Failed to broadcast location", err);
      }
    };

    broadcast();
    const interval = setInterval(broadcast, 30000);
    return () => clearInterval(interval);
  }, [isLabor, status, jobId]);

  // Wait for the client to confirm the laborer has reached the destination.
  useEffect(() => {
    if (!isLabor) return;

    const socket = getSocket();
    const handleDestinationConfirmed = (payload: { jobId?: string; workerId?: string }) => {
      if (jobId && payload.jobId && payload.jobId !== jobId) return;
      if (payload.workerId && workerId && payload.workerId !== workerId) return;
      setArrivalConfirmed(true);
    };

    socket.on("destination_confirmed", handleDestinationConfirmed);
    return () => {
      socket.off("destination_confirmed", handleDestinationConfirmed);
    };
  }, [isLabor, jobId, workerId]);

  const statusSteps = [
    { key: "on-the-way", label: "On the way", completed: true },
    { key: "arrived", label: "Arrived", completed: status !== "on-the-way" },
    { key: "working", label: "Working", completed: status === "working" || status === "completed" },
    { key: "completed", label: "Completed", completed: status === "completed" },
  ];

  const handleNextStep = () => {
    const socket = getSocket();
    if (status === "on-the-way") {
      setStatus("arrived");
      socket.emit("worker_arrived_destination", {
        clientId,
        workerId,
        jobId,
      });
    } else if (status === "arrived") {
      if (!arrivalConfirmed) return;
      setStatus("working");
      if (clientId) socket.emit("work_started", { clientId, jobId });
    } else if (status === "working") {
      setStatus("completed");
      if (clientId) socket.emit("work_completed", { clientId, jobId, workerId, earnings, elapsed });
    }
  };

  const getButtonText = () => {
    if (status === "on-the-way") return "Mark as Arrived";
    if (status === "arrived") {
      return arrivalConfirmed ? "Start Work" : "Waiting for Client Confirmation";
    }
    if (status === "working") return "Complete Work";
    return "Request Payment";
  };

  const formatElapsed = () => {
    const h = Math.floor(elapsed / 3600);
    const m = Math.floor((elapsed % 3600) / 60);
    const s = elapsed % 60;
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  const earnings = ((elapsed / 3600) * chargePerHour).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Job in Progress</h1>
        <p className="text-white/60">Track your work status</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        {clientCoords && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-4">Client Location</h3>
            <div className="h-48 rounded-2xl overflow-hidden border border-white/10 mb-3">
              <MapView
                centerCoords={clientCoords}
                zoom={15}
                markers={clientMarkers}
                mapStyle="dark"
                showCenterMe={false}
                className="h-full"
              />
            </div>
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin size={16} className="text-[#F4C430]" />
              <span>{jobAddress}</span>
            </div>
            <p className="mt-2 text-xs text-white/45">
              Coordinates: {clientCoords[1].toFixed(5)}, {clientCoords[0].toFixed(5)}
            </p>
          </Card>
        )}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Client Information</h3>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-xl">Ã°Å¸â€˜Â¤</span>
            </div>
            <div className="flex-1">
              <p className="text-lg font-semibold text-white">{clientName}</p>
              <p className="text-sm text-white/60">{jobTitle}</p>
            </div>
          </div>

          {/* Phone / WhatsApp row */}
          {clientPhone ? (
            <a
              href={`https://wa.me/${clientPhone.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-green-500/10 border border-green-500/25 mb-4"
            >
              <div className="w-8 h-8 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                <Phone size={15} className="text-green-400" />
              </div>
              <div className="flex-1">
                <p className="text-[10px] text-white/40 leading-none mb-0.5">Client's Phone</p>
                <p className="text-sm font-semibold text-green-400">{clientPhone}</p>
              </div>
              <span className="text-xs text-green-400/70 font-medium">WhatsApp Ã¢â€ â€™</span>
            </a>
          ) : (
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 mb-4">
              <Phone size={15} className="text-white/30" />
              <span className="text-sm text-white/30">Phone not available</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-white/70 text-sm">
            <MapPin size={16} className="text-[#F4C430]" />
            <span>{jobAddress}</span>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Job Status</h3>
          <div className="space-y-3">
            {statusSteps.map((step) => (
              <div key={step.key} className="flex items-center gap-3">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                    step.completed
                      ? "bg-[#F4C430] border-[#F4C430]"
                      : "border-white/20 bg-transparent"
                  }`}
                >
                  {step.completed && <CheckCircle size={18} className="text-[#0B1C2C]" />}
                </div>
                <div className="flex-1">
                  <p
                    className={`font-medium ${
                      step.completed ? "text-white" : "text-white/40"
                    }`}
                  >
                    {step.label}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Time & Earnings</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <Clock size={18} className="text-[#F4C430]" />
                <span>Time Elapsed</span>
              </div>
              <span className="text-lg font-bold text-white">
                {status === "working" || status === "completed" ? formatElapsed() : "Ã¢â‚¬â€"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <Banknote size={18} className="text-[#F4C430]" />
                <span>Current Earnings</span>
              </div>
              <span className="text-2xl font-bold text-[#F4C430]">
                {status === "working" || status === "completed" ? `Rs ${earnings}` : "Ã¢â‚¬â€"}
              </span>
            </div>
          </div>
        </Card>

        {status === "completed" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className="bg-[#F4C430]/10 border-[#F4C430]/30">
              <p className="text-white/80 text-center">
                Waiting for payment confirmation from client
              </p>
            </Card>
          </motion.div>
        )}

        {status === "arrived" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Card className={arrivalConfirmed ? "bg-green-500/10 border-green-500/30" : "bg-[#F4C430]/10 border-[#F4C430]/30"}>
              <p className="text-white/80 text-center">
                {arrivalConfirmed
                  ? "Client confirmed your arrival. You can start work now."
                  : "Waiting for the client to confirm that you reached the destination."}
              </p>
            </Card>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        {status === "completed" ? (
          <Button variant="primary" fullWidth onClick={() => navigate("/rate-customer", { state: { ...state, earnings } })}>
            Continue
          </Button>
        ) : (
          <Button
            variant="primary"
            fullWidth
            onClick={handleNextStep}
            disabled={status === "arrived" && !arrivalConfirmed}
          >
            {getButtonText()}
          </Button>
        )}
      </motion.div>
    </div>
  );
}
