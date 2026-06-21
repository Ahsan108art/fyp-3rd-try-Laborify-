import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../utils/api";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Toggle } from "../components/Toggle";
import { Bell, MapPin, LogOut } from "lucide-react";
import { getSocket, disconnectSocket } from "../utils/socket";
import { Geolocation } from "@capacitor/geolocation";

const URGENCY_COLORS: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  emergency: 'text-red-400',
};

export function LaborDashboardScreen() {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(false);

  const handleLogout = () => {
    disconnectSocket();
    ["token","userId","userRole","userType","userName","userPhone","userCoords"].forEach(k => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("Worker");
  const [stats, setStats] = useState({ jobsCompleted: 0, rating: 0 });
  const [workerStatus, setWorkerStatus] = useState('offline');

  // Listen for incoming job requests from clients
  useEffect(() => {
    const socket = getSocket();
    const handleJobRequest = (jobData: any) => {
      navigate("/job-request", { state: jobData });
    };
    socket.on("job_request", handleJobRequest);

    // Removed handleJobStatusChanged because we no longer fetch global open jobs
    // The laborer must wait for a direct job_request from the client.

    return () => {
      socket.off("job_request", handleJobRequest);
    };
  }, [navigate, isOnline]);

  // Load profile + real stats on mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/api/workers/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setUserName(data.name || "Worker");
          setIsOnline(data.isOnline ?? false);
          setWorkerStatus(data.status || 'offline');
          setStats({
            jobsCompleted: data.jobsCompleted ?? 0,
            rating: +(data.rating ?? 0).toFixed(1),
          });
        }
      } catch {
        const stored = localStorage.getItem("userName");
        if (stored) setUserName(stored);
      }
    };
    fetchProfile();
  }, []);

  // fetchJobs effect removed

  const handleToggleOnline = async (val: boolean) => {
    const token = localStorage.getItem("token");
    
    if (val) {
      try {
        let permission = await Geolocation.checkPermissions();
        if (permission.location !== 'granted') {
          permission = await Geolocation.requestPermissions();
        }
        
        if (permission.location !== 'granted') {
          alert("GPS Permission is required to go online! Clients need to see your location.");
          return; // Abort turning online
        }

        const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        const { latitude, longitude } = position.coords;

        // Update GPS coordinates in the backend
        await fetch(`${API_URL}/api/workers/location`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latitude, longitude }),
        });
      } catch (err) {
        alert("Failed to get your GPS location. Please try again.");
        return;
      }
    }

    setIsOnline(val);
    setWorkerStatus(val ? 'available' : 'offline');
    try {
      await fetch(`${API_URL}/api/workers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isOnline: val }),
      });
    } catch {
      // ignore
    }
    // if (val) fetchJobs(); // Removed
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome, {userName}</h1>
            <p className="text-white/60 text-sm mt-1">Ready to work today?</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
              <Bell size={20} className="text-white" />
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#F4C430]" />
            </button>
            <button
              onClick={handleLogout}
              className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
            >
              <LogOut size={20} className="text-red-400" />
            </button>
          </div>
        </div>

        <Card className="bg-gradient-to-br from-[#F4C430] to-[#D4A820] border-none">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-[#0B1C2C]/70 mb-1">Status</p>
              <p className="text-lg font-bold text-[#0B1C2C]">
                {workerStatus === 'on_job' ? 'On Job' : workerStatus === 'occupied' ? 'Occupied' : isOnline ? "Online" : "Offline"}
              </p>
            </div>
            <Toggle enabled={isOnline} onChange={handleToggleOnline} />
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-white">
            {isOnline ? "Waiting for Jobs" : "Go Online to Receive Jobs"}
          </h2>
        </div>

        {!isOnline ? (
          <Card className="text-center py-12">
            <p className="text-white/60 mb-2">Turn on your availability</p>
            <p className="text-sm text-white/40">to start receiving job requests</p>
          </Card>
        ) : (
          <Card className="text-center py-12">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[#F4C430]/20 flex items-center justify-center animate-pulse">
                <MapPin size={32} className="text-[#F4C430]" />
              </div>
            </div>
            <p className="text-white font-medium mb-2">You are online and visible to clients.</p>
            <p className="text-sm text-white/50 px-4">Keep this app open. You will receive a direct notification when a client selects you for a job!</p>
          </Card>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8 grid grid-cols-2 gap-4"
      >
        <Card className="text-center py-6">
          <p className="text-3xl font-bold text-[#F4C430] mb-1">{stats.jobsCompleted}</p>
          <p className="text-sm text-white/60">Jobs Completed</p>
        </Card>
        <Card className="text-center py-6">
          <p className="text-3xl font-bold text-[#F4C430] mb-1">
            {stats.rating > 0 ? stats.rating : "—"}
          </p>
          <p className="text-sm text-white/60">Rating</p>
        </Card>
      </motion.div>
    </div>
  );
}
