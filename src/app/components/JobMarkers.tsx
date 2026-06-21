import { motion, AnimatePresence } from 'motion/react';
import { X, Navigation, MapPin, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { Button } from './Button';
import { formatDistance, openNativeMaps, type Coords } from '../utils/geo';

const URGENCY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Low' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Medium' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'High' },
  emergency: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Emergency' },
};

export interface JobFeature {
  id: string;
  title: string;
  category?: string;
  price?: number;
  budgetMax?: number;
  urgency?: string;
  issueSummary?: string;
  coordinates: Coords;
  creatorName?: string;
  estimatedDuration?: string;
}

interface JobBottomSheetProps {
  job: JobFeature | null;
  userCoords: Coords | null;
  onClose: () => void;
  onViewDetails?: (job: JobFeature) => void;
}

export function JobBottomSheet({
  job,
  userCoords,
  onClose,
  onViewDetails,
}: JobBottomSheetProps) {
  if (!job) return null;

  const distanceM =
    userCoords
      ? Math.round(
          haversine(userCoords, job.coordinates)
        )
      : null;

  const urgencyStyle = URGENCY_COLORS[job.urgency || 'medium'] || URGENCY_COLORS.medium;
  const priceDisplay = job.budgetMax || job.price;

  return (
    <AnimatePresence>
      {job && (
        <motion.div
          key={job.id}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute bottom-0 left-0 right-0 z-20 rounded-t-3xl bg-[#112233] border-t border-white/10 px-5 py-4 shadow-2xl"
          style={{ touchAction: 'none' }}
        >
          {/* Handle */}
          <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"
          >
            <X size={14} className="text-white" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            {/* Category badge */}
            {job.category && (
              <span className="px-3 py-1 rounded-full bg-[#F4C430]/20 text-[#F4C430] text-xs font-medium">
                {job.category}
              </span>
            )}
            {/* Urgency badge */}
            {job.urgency && job.urgency !== 'medium' && (
              <span className={`px-3 py-1 rounded-full ${urgencyStyle.bg} ${urgencyStyle.text} text-xs font-medium flex items-center gap-1`}>
                <AlertTriangle size={12} />
                {urgencyStyle.label}
              </span>
            )}
          </div>

          <h2 className="text-xl font-bold text-white mt-1 mb-1">{job.title}</h2>
          
          {job.issueSummary && (
             <p className="text-sm text-white/70 mb-2 line-clamp-2">{job.issueSummary}</p>
          )}

          {job.creatorName && (
            <p className="text-sm text-white/50 mb-3">Posted by {job.creatorName}</p>
          )}

          <div className="flex items-center gap-4 mb-5 flex-wrap">
            {distanceM !== null && (
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <MapPin size={14} className="text-[#F4C430]" />
                <span>{formatDistance(distanceM)} away</span>
              </div>
            )}
            {priceDisplay ? (
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <DollarSign size={14} className="text-[#F4C430]" />
                <span>PKR {priceDisplay}</span>
              </div>
            ) : null}
            {job.estimatedDuration && (
              <div className="flex items-center gap-1.5 text-sm text-white/60">
                <Clock size={14} className="text-[#F4C430]" />
                <span>{job.estimatedDuration}</span>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              fullWidth
              onClick={() => openNativeMaps(job.coordinates, job.title)}
            >
              <Navigation size={16} />
              Navigate
            </Button>
            {onViewDetails && (
              <Button
                variant="primary"
                fullWidth
                onClick={() => onViewDetails(job)}
              >
                View Details
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Inline haversine to avoid circular import
function haversine(a: Coords, b: Coords): number {
  const R = 6371000;
  const dLat = toRad(b[1] - a[1]);
  const dLng = toRad(b[0] - a[0]);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a[1])) * Math.cos(toRad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function toRad(d: number) { return (d * Math.PI) / 180; }
