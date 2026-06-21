import { Card } from "./Card";
import { StarRating } from "./StarRating";
import { MapPin, Clock } from "lucide-react";
import { Button } from "./Button";

const STATUS_STYLES: Record<string, { dot: string; label: string }> = {
  available: { dot: 'bg-green-400', label: 'Available' },
  occupied: { dot: 'bg-red-400', label: 'Occupied' },
  on_job: { dot: 'bg-orange-400', label: 'Occupied' },
  busy: { dot: 'bg-yellow-400', label: 'Busy' },
  offline: { dot: 'bg-gray-400', label: 'Offline' },
};

interface WorkerCardProps {
  name: string;
  rating: number;
  distance: string;
  pricePerHour: number;
  skills?: string[];
  image?: string;
  status?: string;
  isOnline?: boolean;
  jobsCompleted?: number;
  onAccept?: () => void;
  onViewProfile?: () => void;
}

export function WorkerCard({
  name,
  rating,
  distance,
  pricePerHour,
  skills = [],
  image,
  status = 'available',
  isOnline = true,
  jobsCompleted,
  onAccept,
  onViewProfile,
}: WorkerCardProps) {
  const isAvailable = status === 'available' && isOnline;
  const statusStyle = STATUS_STYLES[status] || STATUS_STYLES.available;

  return (
    <Card className="space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center overflow-hidden relative">
          {image ? (
            <img src={image} alt={name} className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl text-white/50">👤</span>
          )}
          {/* Online/status indicator dot */}
          <div
            className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-[#0F2236] ${statusStyle.dot}`}
            title={statusStyle.label}
          />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">{name}</h3>
            {!isAvailable && (
              <span className="px-2 py-0.5 rounded-lg bg-red-500/20 text-red-400 text-[10px] font-medium">
                {statusStyle.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <StarRating value={rating} readonly size={16} />
            <span className="text-sm text-white/50">({rating})</span>
          </div>
          <div className="flex items-center gap-4 mt-2 text-sm text-white/60">
            <div className="flex items-center gap-1">
              <MapPin size={14} />
              <span>{distance}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>PKR {pricePerHour}/hr</span>
            </div>
            {jobsCompleted !== undefined && jobsCompleted > 0 && (
              <span className="text-white/40">{jobsCompleted} jobs</span>
            )}
          </div>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="px-3 py-1 rounded-full bg-white/5 text-xs text-white/70"
            >
              {skill}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-3">
        {onViewProfile && (
          <Button variant="outline" onClick={onViewProfile} fullWidth>
            View Profile
          </Button>
        )}
        {onAccept && (
          <Button
            variant="primary"
            onClick={isAvailable ? onAccept : undefined}
            fullWidth
            disabled={!isAvailable}
          >
            {isAvailable ? 'Accept' : 'Unavailable'}
          </Button>
        )}
      </div>
    </Card>
  );
}
