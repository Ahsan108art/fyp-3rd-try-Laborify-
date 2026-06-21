import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StarRating } from "../components/StarRating";
import { MapPin, Clock, DollarSign, Briefcase, Navigation, Phone, ArrowLeft } from "lucide-react";
import type { Coords } from "../utils/geo";
import { getSocket } from "../utils/socket";
import { Geolocation } from "@capacitor/geolocation";

export function ConfirmBookingScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const worker = state?.worker || {
    name: "Worker",
    rating: 0,
    distance: "Unknown",
    pricePerHour: 0,
    skills: [],
    jobsCompleted: 0,
  };

  const [confirming, setConfirming] = useState(false);
  const [confirmingText, setConfirmingText] = useState("");

  const handleConfirm = async () => {
    setConfirming(true);

    const clientId = localStorage.getItem("userId") ?? "";
    const jobId = state?.jobId;

    const proceed = (clientCoords: Coords, laborerCoords: Coords) => {
      setConfirmingText("Requesting worker...");
      getSocket().timeout(5000).emit("job_request", {
        workerId: worker._id,
        clientId,
        jobId,
        clientName: localStorage.getItem("userName") ?? "Client",
        clientPhone: localStorage.getItem("userPhone") ?? "",
        jobTitle: state?.category || worker.skills?.[0] || "Job",
        address: state?.address ?? "On-site",
        pricePerHour: worker.pricePerHour,
        description: state?.description || "",
        clientCoords,
      }, (err: any, response: any) => {
        if (err) {
          alert("Network error. Please check your connection and try again.");
          setConfirming(false);
          setConfirmingText("");
          return;
        }
        if (response && !response.success) {
          alert(response.message || 'Worker is no longer available.');
          setConfirming(false);
          setConfirmingText("");
          navigate(-1);
        } else {
          navigate("/live-tracking", { state: { worker, clientCoords, laborerCoords, jobId } });
        }
      });
    };

    const workerCoords = worker.location?.coordinates;

    try {
      setConfirmingText("Getting your location...");
      const permission = await Geolocation.requestPermissions();
      if (permission.location !== 'granted') throw new Error("Denied");
      // Added a 5-second timeout so it never hangs indefinitely
      const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 5000 });
      const clientCoords: Coords = [pos.coords.longitude, pos.coords.latitude];
      const laborCoords: Coords = (workerCoords && workerCoords[0] !== 0 && workerCoords[1] !== 0)
        ? [workerCoords[0], workerCoords[1]]
        : [clientCoords[0] - 0.020, clientCoords[1] - 0.015];
      proceed(clientCoords, laborCoords);
    } catch {
      const defaultClient: Coords = [74.3587, 31.5204];
      const laborCoords: Coords = (workerCoords && workerCoords[0] !== 0 && workerCoords[1] !== 0)
        ? [workerCoords[0], workerCoords[1]]
        : [74.3387, 31.5054];
      proceed(defaultClient, laborCoords);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Confirm Booking</h1>
            <p className="text-white/60 text-sm">Review details before confirming</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Worker Details</h3>
          <div className="flex items-start gap-4 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-white">{worker.name}</h4>
              <div className="flex items-center gap-2 mt-1">
                <StarRating value={worker.rating} readonly size={16} />
                <span className="text-sm text-white/50">({worker.rating})</span>
              </div>
              <p className="text-sm text-white/60 mt-2">
                {worker.jobsCompleted ?? 0} jobs completed
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-white/70 text-sm">
              <MapPin size={16} className="text-[#F4C430]" />
              <span>{worker.distance} away</span>
            </div>
            {worker.phoneNumber && (
              <a
                href={`https://wa.me/${worker.phoneNumber.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium"
              >
                <Phone size={12} />
                WhatsApp
              </a>
            )}
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Service Details</h3>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Briefcase size={18} className="text-[#F4C430]" />
              <div>
                <p className="text-sm text-white/60">Services</p>
                <p className="text-white font-medium">
                  {worker.skills?.length > 0 ? worker.skills.join(', ') : state?.category || 'General'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin size={18} className="text-[#F4C430]" />
              <div>
                <p className="text-sm text-white/60">Location</p>
                <p className="text-white font-medium">
                  {state?.address ?? "On-site"}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Pricing</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <DollarSign size={18} className="text-[#F4C430]" />
                <span>Hourly Rate</span>
              </div>
              <span className="text-lg font-semibold text-white">PKR {worker.pricePerHour}/hr</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <Clock size={18} className="text-[#F4C430]" />
                <span>Estimated Duration</span>
              </div>
              <span className="text-lg font-semibold text-white">Varies</span>
            </div>
            <div className="h-px bg-white/10 my-3" />
            <div className="flex items-center justify-between">
              <span className="text-white">Estimated Total</span>
              <span className="text-xl font-bold text-[#F4C430]">
                PKR {worker.pricePerHour > 0 ? `${worker.pricePerHour * 2}–${worker.pricePerHour * 4}` : 'TBD'}
              </span>
            </div>
          </div>
        </Card>

        <Card className="bg-[#F4C430]/10 border-[#F4C430]/30">
          <div className="flex items-start gap-3">
            <Navigation size={16} className="text-[#F4C430] mt-0.5 shrink-0" />
            <p className="text-sm text-white/80">
              After confirming, you'll see the worker's live location on the map
              as they travel to you — just like a ride-hailing app.
            </p>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <Button
          variant="primary"
          fullWidth
          onClick={handleConfirm}
          disabled={confirming}
        >
          {confirming ? confirmingText || "Processing…" : "Confirm & Track Worker"}
        </Button>
      </motion.div>
    </div>
  );
}
