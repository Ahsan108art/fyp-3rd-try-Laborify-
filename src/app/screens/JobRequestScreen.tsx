import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { MapPin, Banknote, Briefcase, Phone, ArrowLeft, AlertTriangle, Clock, Image } from "lucide-react";
import { getSocket } from "../utils/socket";

const URGENCY_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  low: { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Low' },
  medium: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Medium' },
  high: { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'High' },
  emergency: { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Emergency' },
};

export function JobRequestScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [busy, setBusy] = useState(false);

  const jobData = state as {
    clientId?: string;
    jobId?: string;
    clientName?: string;
    clientPhone?: string;
    jobTitle?: string;
    address?: string;
    pricePerHour?: number;
    clientCoords?: [number, number];
    description?: string;
    issueSummary?: string;
    urgency?: string;
    preferredTime?: string;
    budgetMin?: number;
    budgetMax?: number;
    images?: string[];
    job?: any;
  } | null;

  const clientName = jobData?.clientName ?? jobData?.job?.creatorId?.name ?? "Client";
  const clientPhone = jobData?.clientPhone ?? jobData?.job?.creatorId?.phoneNumber ?? "";
  const jobTitle = jobData?.jobTitle ?? jobData?.job?.title ?? "Job Request";
  const address = jobData?.address ?? jobData?.job?.address ?? "On-site";
  const pricePerHour = jobData?.pricePerHour ?? jobData?.job?.price ?? 25;
  const description = jobData?.description ?? jobData?.job?.description ?? "";
  const issueSummary = jobData?.issueSummary ?? jobData?.job?.issueSummary ?? "";
  const urgency = jobData?.urgency ?? jobData?.job?.urgency ?? "medium";
  const preferredTime = jobData?.preferredTime ?? jobData?.job?.preferredTime ?? "";
  const budgetMin = jobData?.budgetMin ?? jobData?.job?.budgetMin ?? 0;
  const budgetMax = jobData?.budgetMax ?? jobData?.job?.budgetMax ?? 0;
  const images = jobData?.images ?? jobData?.job?.images ?? [];
  const urgencyStyle = URGENCY_COLORS[urgency] || URGENCY_COLORS.medium;

  const handleAccept = () => {
    setBusy(true);
    getSocket().emit("job_accepted", {
      clientId: jobData?.clientId,
      workerId: localStorage.getItem("userId"),
      jobId: jobData?.jobId ?? jobData?.job?._id,
    });
    navigate("/job-in-progress", {
      state: {
        jobId: jobData?.jobId ?? jobData?.job?._id,
        clientId: jobData?.clientId,
        clientName,
        clientPhone,
        jobTitle,
        address: jobData?.address,
        chargePerHour: pricePerHour,
        clientCoords: jobData?.clientCoords,
      },
    });
  };

  const handleDecline = () => {
    setBusy(true);
    getSocket().emit("job_declined", { clientId: jobData?.clientId });
    navigate(-1);
  };

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
          <div>
            <h1 className="text-2xl font-bold text-white">New Job Request</h1>
            <p className="text-white/60 text-sm">Review the details and respond</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4"
      >
        {/* Client Info */}
        <Card>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-xl">
              ðŸ‘¤
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{clientName}</h3>
              <p className="text-sm text-white/50">Client</p>
            </div>
            {/* Urgency badge */}
            <span className={`px-3 py-1.5 rounded-xl ${urgencyStyle.bg} ${urgencyStyle.text} text-xs font-medium flex items-center gap-1`}>
              <AlertTriangle size={12} />
              {urgencyStyle.label}
            </span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-2 text-sm text-white/70">
              <MapPin size={15} className="text-[#F4C430]" />
              <span className="line-clamp-1">{address}</span>
            </div>
            {clientPhone && (
              <a
                href={`https://wa.me/${clientPhone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-xs font-medium shrink-0"
              >
                <Phone size={12} />
                WhatsApp
              </a>
            )}
          </div>
        </Card>

        {/* Job Details */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-3">Job Details</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Briefcase size={16} className="text-[#F4C430] mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-white font-medium">{jobTitle}</p>
                {issueSummary && (
                  <p className="text-sm text-white/60 mt-1">{issueSummary}</p>
                )}
              </div>
            </div>

            {description && (
              <div className="p-3 bg-white/5 rounded-xl">
                <p className="text-sm text-white/80 leading-relaxed">{description}</p>
              </div>
            )}

            {preferredTime && (
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Clock size={14} className="text-[#F4C430]" />
                <span>Preferred: {preferredTime}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Images */}
        {images.length > 0 && (
          <Card>
            <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <Image size={16} className="text-[#F4C430]" />
              Photos
            </h3>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {images.map((img: string, i: number) => (
                <img
                  key={i}
                  src={img.startsWith('/uploads') ? `${(window as any).__API_URL || ''}${img}` : img}
                  alt={`Job photo ${i + 1}`}
                  className="w-24 h-24 rounded-xl object-cover shrink-0 border border-white/10"
                />
              ))}
            </div>
          </Card>
        )}

        {/* Payment & Budget */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Payment</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white/70">
                <Banknote size={18} className="text-[#F4C430]" />
                <span>Hourly Rate</span>
              </div>
              <span className="text-xl font-bold text-[#F4C430]">PKR {pricePerHour}/hr</span>
            </div>
            {(budgetMin > 0 || budgetMax > 0) && (
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-sm text-white/60">Client Budget</span>
                <span className="text-sm font-medium text-white">
                  PKR {budgetMin > 0 ? budgetMin.toLocaleString() : 'â€”'} â€“ {budgetMax > 0 ? budgetMax.toLocaleString() : 'â€”'}
                </span>
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-[#F4C430]/10 border-[#F4C430]/30">
          <p className="text-sm text-white/80 text-center">
            Accepting will start navigation to the client's location
          </p>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-6 flex gap-4"
      >
        <Button
          variant="outline"
          fullWidth
          onClick={handleDecline}
          disabled={busy}
        >
          Decline
        </Button>
        <Button
          variant="primary"
          fullWidth
          onClick={handleAccept}
          disabled={busy}
        >
          Accept
        </Button>
      </motion.div>
    </div>
  );
}
