import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { MapPin, Navigation, Search, X } from "lucide-react";
import { Geolocation } from "@capacitor/geolocation";
import { getGeocodeData, forwardGeocode, type GeocodeSuggestion } from "../utils/mapbox";
import { MapView, type MapMarker } from "../components/MapView";
import type { Coords } from "../utils/geo";

export function LocationSetupScreen() {
  const navigate = useNavigate();
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [detecting, setDetecting] = useState(false);
  
  // Map state
  const [pinCoords, setPinCoords] = useState<Coords | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const markers: MapMarker[] = pinCoords
    ? [{ id: 'setup-pin', coordinates: pinCoords, type: 'pin', pulse: true }]
    : [];

  const handleMapClick = useCallback(async (coords: Coords) => {
    setPinCoords(coords);
    setDetecting(true);
    try {
      const data = await getGeocodeData(coords);
      setCity(data.city);
      setArea(data.area);
      setSearchQuery(`${data.area}, ${data.city}`);
    } finally {
      setDetecting(false);
    }
  }, []);

  const handleSearchChange = async (val: string) => {
    setSearchQuery(val);
    if (val.length > 2) {
      const results = await forwardGeocode(val);
      setSuggestions(results);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelectSuggestion = async (s: GeocodeSuggestion) => {
    setSearchQuery(s.place_name);
    setShowSuggestions(false);
    setPinCoords(s.center);
    setDetecting(true);
    try {
      const data = await getGeocodeData(s.center);
      setCity(data.city);
      setArea(data.area);
    } finally {
      setDetecting(false);
    }
  };

  const handleUseCurrentLocation = async () => {
    setDetecting(true);
    try {
      let permission = await Geolocation.checkPermissions();
      if (permission.location !== 'granted') {
        permission = await Geolocation.requestPermissions();
      }
      
      if (permission.location !== 'granted') {
        alert("GPS Permission denied! Please enable location permissions in your Android settings.");
        throw new Error("Permission denied");
      }

      const position = await Geolocation.getCurrentPosition({ enableHighAccuracy: true });
      const { latitude, longitude } = position.coords;
      
      const coords: Coords = [longitude, latitude];
      setPinCoords(coords);
      
      const data = await getGeocodeData(coords);
      setCity(data.city);
      setArea(data.area);
      setSearchQuery(`${data.area}, ${data.city}`);
    } catch (error) {
      console.error("GPS failed, trying IP fallback:", error);
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        const coords: Coords = [ipData.longitude || 74.3587, ipData.latitude || 31.5204];
        setPinCoords(coords);
        
        const data = await getGeocodeData(coords);
        setCity(data.city);
        setArea(data.area);
        setSearchQuery(`${data.area}, ${data.city}`);
      } catch (fallbackError) {
        console.error("IP fallback also failed:", fallbackError);
        alert("Could not detect your location. Please tap the map manually.");
      }
    } finally {
      setDetecting(false);
    }
  };

  const handleFinish = () => {
    const userType = localStorage.getItem("userType");
    navigate(userType === "labor" ? "/profile-created" : "/find-worker");
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col pt-8 pb-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 px-6"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Location Setup</h1>
        <p className="text-white/60">Where do you work?</p>
      </motion.div>

      {/* Map Container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mx-4 mb-6 rounded-3xl overflow-hidden shrink-0"
      >
        <MapView
          zoom={13}
          markers={markers}
          onMapClick={handleMapClick}
          mapStyle="dark"
          showCenterMe
          className="h-56"
        />

        {!pinCoords && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-[#0B1C2C]/80 border border-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm flex items-center gap-2"
            >
              <MapPin size={16} className="text-[#F4C430]" />
              <span className="text-sm text-white">Tap map to set service area</span>
            </motion.div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-6 space-y-5"
      >
        {/* Address Search Bar */}
        <div className="relative">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus-within:border-[#F4C430]/50 transition-colors">
            <Search size={18} className="text-white/40 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={detecting ? 'Getting address…' : 'Search or tap map to set location'}
              className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none"
            />
            {pinCoords && (
              <button
                onClick={() => { setPinCoords(null); setCity(''); setArea(''); setSearchQuery(''); }}
                className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0 hover:bg-white/30"
              >
                <X size={10} className="text-white" />
              </button>
            )}
          </div>

          <AnimatePresence>
            {showSuggestions && suggestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="absolute top-full left-0 right-0 mt-1 bg-[#112233] border border-white/10 rounded-2xl overflow-hidden z-30 shadow-xl"
              >
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onMouseDown={() => handleSelectSuggestion(s)}
                    className="w-full px-4 py-3 text-left text-sm text-white/80 hover:bg-white/5 border-b border-white/5 last:border-0 flex items-start gap-3 transition-colors"
                  >
                    <MapPin size={14} className="text-[#F4C430] mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{s.place_name}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Button
          variant="outline"
          fullWidth
          onClick={handleUseCurrentLocation}
          disabled={detecting}
        >
          <Navigation size={20} />
          {detecting ? "Locating..." : "Use Current GPS Location"}
        </Button>

        {city || area ? (
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-[#F4C430] mt-0.5" />
              <div>
                <p className="text-sm text-white/80 mb-1">Confirmed Service Area:</p>
                <p className="text-white font-medium">
                  {area && city ? `${area}, ${city}` : area || city}
                </p>
                <p className="text-xs text-white/50 mt-1">
                  You'll be visible to clients searching in this exact region.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-2xl">
            <p className="text-sm text-white/80 text-center">
              <strong className="text-[#F4C430]">📍 Required:</strong> Tap the map, search an address, or use GPS to define your service zone.
            </p>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-6 pt-6"
      >
        <Button 
          variant="primary" 
          fullWidth 
          onClick={handleFinish}
          disabled={!city && !area}
        >
          Finish Setup
        </Button>
      </motion.div>
    </div>
  );
}
