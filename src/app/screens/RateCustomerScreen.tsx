import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StarRating } from "../components/StarRating";
import { Sparkles } from "lucide-react";

export function RateCustomerScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const earnings = state?.earnings || 0;
  const clientName = state?.job?.creatorId?.name ?? state?.clientName ?? "Client";
  const jobTitle = state?.job?.title ?? state?.worker?.skills?.[0] ?? "Job";

  const handleSubmit = () => {
    // Submit rating
    navigate("/labor-dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-[#F4C430]/20 flex items-center justify-center">
            <Sparkles size={24} className="text-[#F4C430]" />
          </div>
          <h1 className="text-2xl font-bold text-white">Rate Customer</h1>
        </div>
        <p className="text-white/60">How was your experience?</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{clientName}</p>
              <p className="text-sm text-white/60">{jobTitle}</p>
            </div>
          </div>

          <div className="text-center py-6">
            <p className="text-white/70 mb-4">Rate this customer</p>
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} size={40} />
            </div>
            {rating > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#F4C430] font-semibold mt-4"
              >
                {rating === 5
                  ? "Excellent!"
                  : rating === 4
                  ? "Great!"
                  : rating === 3
                  ? "Good"
                  : rating === 2
                  ? "Fair"
                  : "Poor"}
              </motion.p>
            )}
          </div>
        </Card>

        <Card>
          <label className="block text-white/70 mb-3">Leave a comment (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience working with this customer..."
            rows={5}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 resize-none"
          />
        </Card>

        <Card className="bg-gradient-to-br from-[#F4C430]/10 to-[#D4A820]/10 border-[#F4C430]/30">
          <div className="text-center">
            <p className="text-2xl font-bold text-white mb-1">Rs {earnings}</p>
            <p className="text-sm text-white/60">Total Earned</p>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-xs text-white/50">Payment will be credited within 24 hours</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mt-8"
      >
        <Button variant="primary" fullWidth onClick={handleSubmit} disabled={rating === 0}>
          Submit Review
        </Button>
      </motion.div>
    </div>
  );
}
