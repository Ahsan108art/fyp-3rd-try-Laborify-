import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { Navigation, Zap, Droplet, Hammer, PaintBucket, Leaf, LogOut, Wrench, Sparkles, Wind } from "lucide-react";
import { reverseGeocode } from "../utils/mapbox";
import { disconnectSocket } from "../utils/socket";
import type { Coords } from "../utils/geo";
import { Geolocation } from "@capacitor/geolocation";

const categories = [
  { id: "Electrician", name: "Electrician", icon: Zap, color: "#F4C430" },
  { id: "Plumber", name: "Plumber", icon: Droplet, color: "#3B82F6" },
  { id: "Carpenter", name: "Carpenter", icon: Hammer, color: "#8B5CF6" },
  { id: "Painter", name: "Painter", icon: PaintBucket, color: "#F59E0B" },
  { id: "Welder", name: "Welder", icon: Wrench, color: "#EF4444" },
  { id: "Mason", name: "Mason", icon: Hammer, color: "#9CA3AF" },
  { id: "Gardener", name: "Gardener", icon: Leaf, color: "#10B981" },
  { id: "Cleaner", name: "Cleaner", icon: Sparkles, color: "#60A5FA" },
  { id: "AC Technician", name: "AC Technician", icon: Wind, color: "#34D399" },
  { id: "Mechanic", name: "Mechanic", icon: Wrench, color: "#6B7280" },
];

export function FindWorkerScreen() {
  const navigate = useNavigate();
  const [detecting, setDetecting] = useState(true);

  const handleLogout = () => {
    disconnectSocket();
    ["token","userId","userRole","userType","userName","userPhone","userCoords"].forEach(k => localStorage.removeItem(k));
    navigate("/login", { replace: true });
  };
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState("Detecting your location...");
  const [coords, setCoords] = useState<Coords | null>(null);

  useEffect(() => {
    let mounted = true;

    const getLocation = async () => {
      try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted') {
          throw new Error("Permission denied");
        }

        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        if (!mounted) return;

        const c: Coords = [pos.coords.longitude, pos.coords.latitude];
        setCoords(c);
        localStorage.setItem("userCoords", JSON.stringify(c));
        try {
          const label = await reverseGeocode(c);
          setLocationLabel(label);
        } catch {
          setLocationLabel(`${pos.coords.latitude.toFixed(3)}, ${pos.coords.longitude.toFixed(3)}`);
        }
      } catch (err) {
        if (mounted) {
          setLocationLabel("Location unavailable");
        }
      } finally {
        if (mounted) {
          setDetecting(false);
        }
      }
    };

    getLocation();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-white">Find a Worker</h1>
          <button
            onClick={handleLogout}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <LogOut size={18} className="text-red-400" />
          </button>
        </div>
        <p className="text-white/60">What service do you need?</p>
      </motion.div>

      {detecting ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <div className="w-24 h-24 rounded-full bg-[#F4C430]/20 flex items-center justify-center mb-6 relative">
            <Navigation size={40} className="text-[#F4C430]" />
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute inset-0 rounded-full border-4 border-[#F4C430]"
            />
          </div>
          <p className="text-lg text-white">Detecting your location...</p>
        </motion.div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 p-5 bg-white/5 rounded-2xl border border-white/10"
          >
            <div className="flex items-center gap-3">
              <Navigation size={20} className="text-[#F4C430]" />
              <div>
                <p className="text-sm text-white/60">Your Location</p>
                <p className="text-white font-medium line-clamp-1">{locationLabel}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-xl font-semibold text-white mb-4">Select Category</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((category, index) => {
                const Icon = category.icon;
                const isSelected = selectedCategory === category.id;

                return (
                  <motion.button
                    key={category.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`
                      p-6 rounded-2xl transition-all
                      ${
                        isSelected
                          ? "bg-[#F4C430] border-[#F4C430]"
                          : "bg-white/5 border-white/10 hover:border-[#F4C430]/50"
                      }
                      border-2
                    `}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 ${
                        isSelected ? "bg-[#0B1C2C]/20" : "bg-white/10"
                      }`}
                    >
                      <Icon
                        size={28}
                        className={isSelected ? "text-[#0B1C2C]" : "text-[#F4C430]"}
                      />
                    </div>
                    <p
                      className={`font-semibold ${
                        isSelected ? "text-[#0B1C2C]" : "text-white"
                      }`}
                    >
                      {category.name}
                    </p>
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-8"
          >
            <Button
              variant="primary"
              fullWidth
              onClick={() =>
                navigate("/service-selection", {
                  state: { category: selectedCategory, coords },
                })
              }
              disabled={!selectedCategory}
            >
              Continue
            </Button>
          </motion.div>
        </>
      )}
    </div>
  );
}
