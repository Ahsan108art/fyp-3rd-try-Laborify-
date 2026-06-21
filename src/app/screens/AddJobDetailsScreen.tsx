import { useState, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { API_URL } from '../utils/api';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../components/Button';
import { MapView, type MapMarker } from '../components/MapView';
import { reverseGeocode, forwardGeocode, type GeocodeSuggestion } from '../utils/mapbox';
import { Upload, X, MapPin, Search, ArrowLeft, AlertTriangle, Clock, DollarSign } from 'lucide-react';
import type { Coords } from '../utils/geo';

const URGENCY_LEVELS = [
  { id: 'low', label: 'Low', color: '#10B981', bgColor: '#10B981/20' },
  { id: 'medium', label: 'Medium', color: '#F59E0B', bgColor: '#F59E0B/20' },
  { id: 'high', label: 'High', color: '#F97316', bgColor: '#F97316/20' },
  { id: 'emergency', label: 'Emergency', color: '#EF4444', bgColor: '#EF4444/20' },
];

export function AddJobDetailsScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const category: string = (state as any)?.category ?? '';

  const [title, setTitle] = useState(category ? category.charAt(0).toUpperCase() + category.slice(1) + ' Service' : '');
  const [description, setDescription] = useState('');
  const [issueSummary, setIssueSummary] = useState('');
  const [urgency, setUrgency] = useState('medium');
  const [preferredTime, setPreferredTime] = useState('');
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  // Map state
  const [pinCoords, setPinCoords] = useState<Coords | null>(null);
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [geocoding, setGeocoding] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markers: MapMarker[] = pinCoords
    ? [{ id: 'job-pin', coordinates: pinCoords, type: 'pin', pulse: true }]
    : [];

  const handleMapClick = useCallback(async (coords: Coords) => {
    setPinCoords(coords);
    setGeocoding(true);
    try {
      const place = await reverseGeocode(coords);
      setAddress(place);
      setSearchQuery(place);
    } finally {
      setGeocoding(false);
    }
  }, []);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (value.trim().length < 2) { setSuggestions([]); return; }
    searchTimer.current = setTimeout(async () => {
      const results = await forwardGeocode(value);
      setSuggestions(results);
    }, 350);
  };

  const handleSelectSuggestion = (s: GeocodeSuggestion) => {
    setPinCoords(s.center);
    setAddress(s.place_name);
    setSearchQuery(s.place_name);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remaining = 5 - imagePreviews.length;
    const toAdd = Array.from(files).slice(0, remaining);
    toAdd.forEach(file => {
      setImageFiles(prev => [...prev, file]);
      setImagePreviews(prev => [...prev, URL.createObjectURL(file)]);
    });
  };

  const removeImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const canProceed = title.trim() && description.trim() && pinCoords;

  const handleSubmit = async () => {
    if (!canProceed || submitting) return;
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('category', category);
      formData.append('issueSummary', issueSummary);
      formData.append('urgency', urgency);
      formData.append('preferredTime', preferredTime);
      formData.append('address', address);
      formData.append('longitude', String(pinCoords![0]));
      formData.append('latitude', String(pinCoords![1]));
      if (budgetMin) formData.append('budgetMin', budgetMin);
      if (budgetMax) formData.append('budgetMax', budgetMax);
      imageFiles.forEach(file => formData.append('images', file));

      const res = await fetch(`${API_URL}/api/jobs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const jobId = res.ok ? (await res.json())._id : undefined;

      navigate('/choose-worker', {
        state: {
          title,
          description,
          issueSummary,
          urgency,
          preferredTime,
          budgetMin: budgetMin ? parseFloat(budgetMin) : 0,
          budgetMax: budgetMax ? parseFloat(budgetMax) : 0,
          images: imagePreviews,
          location: pinCoords,
          address,
          jobId,
          category,
        },
      });
    } catch {
      navigate('/choose-worker', {
        state: {
          title,
          description,
          issueSummary,
          urgency,
          preferredTime,
          budgetMin: budgetMin ? parseFloat(budgetMin) : 0,
          budgetMax: budgetMax ? parseFloat(budgetMax) : 0,
          images: imagePreviews,
          location: pinCoords,
          address,
          category,
        },
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pt-8 pb-4"
      >
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Add Job Details</h1>
            <p className="text-white/60 text-sm">Describe the work needed</p>
          </div>
        </div>
      </motion.div>

      {/* Map section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="relative mx-4 mb-4 rounded-3xl overflow-hidden"
      >
        <MapView
          zoom={13}
          markers={markers}
          onMapClick={handleMapClick}
          mapStyle="dark"
          showCenterMe
          className="h-48"
        />

        {!pinCoords && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-[#0B1C2C]/80 border border-white/20 rounded-2xl px-4 py-2 backdrop-blur-sm flex items-center gap-2"
            >
              <MapPin size={16} className="text-[#F4C430]" />
              <span className="text-sm text-white">Tap map to place pin</span>
            </motion.div>
          </div>
        )}
      </motion.div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="flex-1 px-4 space-y-4 pb-6 overflow-y-auto"
      >
        {/* Address search bar */}
        <div className="relative">
          <div className="flex items-center gap-3 px-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus-within:border-[#F4C430]/50 transition-colors">
            <Search size={18} className="text-white/40 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder={geocoding ? 'Getting address…' : 'Search or tap map to set location'}
              className="flex-1 bg-transparent text-white placeholder:text-white/30 text-sm focus:outline-none"
            />
            {pinCoords && (
              <button
                onClick={() => { setPinCoords(null); setAddress(''); setSearchQuery(''); }}
                className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0"
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

          {pinCoords && address && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-2 flex items-center gap-2 px-3 py-2 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-xl"
            >
              <MapPin size={12} className="text-[#F4C430] shrink-0" />
              <span className="text-xs text-[#F4C430] line-clamp-1">{address}</span>
            </motion.div>
          )}
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Job Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Fix short circuit in 3 rooms"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 text-sm"
          />
        </div>

        {/* Issue Summary */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Issue Summary</label>
          <input
            type="text"
            value={issueSummary}
            onChange={(e) => setIssueSummary(e.target.value)}
            placeholder="Brief summary: Main breaker trips repeatedly"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 text-sm"
          />
        </div>

        {/* Detailed Description */}
        <div>
          <label className="block text-sm text-white/70 mb-2">Detailed Description *</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the problem in detail. Include what you've already tried, affected areas, etc."
            rows={4}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 resize-none text-sm"
          />
          <p className="text-xs text-white/40 mt-1">{description.length}/500</p>
        </div>

        {/* Urgency Level */}
        <div>
          <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <AlertTriangle size={14} className="text-[#F4C430]" />
            Urgency Level
          </label>
          <div className="grid grid-cols-4 gap-2">
            {URGENCY_LEVELS.map(level => (
              <button
                key={level.id}
                onClick={() => setUrgency(level.id)}
                className={`py-2.5 px-2 rounded-xl text-xs font-medium transition-all border ${
                  urgency === level.id
                    ? 'border-current'
                    : 'border-white/10 bg-white/5'
                }`}
                style={urgency === level.id ? {
                  backgroundColor: `${level.color}20`,
                  color: level.color,
                  borderColor: `${level.color}60`,
                } : { color: 'rgba(255,255,255,0.5)' }}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>

        {/* Preferred Time */}
        <div>
          <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <Clock size={14} className="text-[#F4C430]" />
            Preferred Time
          </label>
          <input
            type="text"
            value={preferredTime}
            onChange={(e) => setPreferredTime(e.target.value)}
            placeholder="e.g. Today 5 PM - 8 PM, Tomorrow morning"
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 text-sm"
          />
        </div>

        {/* Budget Range */}
        <div>
          <label className="flex items-center gap-2 text-sm text-white/70 mb-2">
            <DollarSign size={14} className="text-[#F4C430]" />
            Budget Range (PKR)
          </label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">Min</span>
              <input
                type="number"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="500"
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 text-sm"
              />
            </div>
            <div className="flex items-center text-white/30">—</div>
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-white/30">Max</span>
              <input
                type="number"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="2000"
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Image upload */}
        <div>
          <label className="block text-sm text-white/70 mb-3">Photos (Max 5)</label>
          <div className="grid grid-cols-5 gap-2">
            {imagePreviews.map((img, index) => (
              <motion.div
                key={img}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden"
              >
                <img src={img} alt="Job" className="w-full h-full object-cover" />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#0B1C2C]/80 flex items-center justify-center"
                >
                  <X size={10} className="text-white" />
                </button>
              </motion.div>
            ))}
            {imagePreviews.length < 5 && (
              <label className="aspect-square rounded-xl bg-white/5 border-2 border-dashed border-white/20 hover:border-[#F4C430]/50 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer">
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                <Upload size={18} className="text-white/40" />
                <span className="text-[10px] text-white/40">Add</span>
              </label>
            )}
          </div>
        </div>

        {!pinCoords && (
          <div className="p-4 bg-[#F4C430]/10 border border-[#F4C430]/30 rounded-2xl">
            <p className="text-sm text-white/80">
              <strong className="text-[#F4C430]">📍 Required:</strong> Tap the map or search an address to set the job location.
            </p>
          </div>
        )}
      </motion.div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="px-4 pb-8"
      >
        <Button
          variant="primary"
          fullWidth
          disabled={!canProceed || submitting}
          onClick={handleSubmit}
        >
          {submitting ? 'Posting Job…' : 'Find Workers'}
        </Button>
      </motion.div>
    </div>
  );
}
