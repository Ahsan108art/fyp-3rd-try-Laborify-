import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { StarRating } from "../components/StarRating";
import { Sparkles, CheckCircle } from "lucide-react";

export function RateLaborScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const worker = state?.worker;
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      navigate("/find-worker");
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0B1C2C] flex flex-col items-center justify-center px-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="mb-8"
        >
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F4C430] to-[#D4A820] flex items-center justify-center shadow-xl shadow-[#F4C430]/20">
            <CheckCircle size={64} className="text-[#0B1C2C]" />
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-2xl font-bold text-white mb-2">Thank You!</h2>
          <p className="text-white/60">Your feedback has been submitted</p>
        </motion.div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-white">Rate Worker</h1>
        </div>
        <p className="text-white/60">Share your experience</p>
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
              <p className="text-lg font-semibold text-white">{worker?.name ?? "Worker"}</p>
              <p className="text-sm text-white/60">{worker?.skills?.join(", ") ?? "Service"}</p>
            </div>
          </div>

          <div className="text-center py-6">
            <p className="text-white/70 mb-4">How was the service?</p>
            <div className="flex justify-center">
              <StarRating value={rating} onChange={setRating} size={40} />
            </div>
            {rating > 0 && (
              <motion.p
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[#F4C430] font-semibold mt-4 text-lg"
              >
                {rating === 5
                  ? "Excellent Work!"
                  : rating === 4
                  ? "Great Job!"
                  : rating === 3
                  ? "Good"
                  : rating === 2
                  ? "Fair"
                  : "Needs Improvement"}
              </motion.p>
            )}
          </div>
        </Card>

        <Card>
          <label className="block text-white/70 mb-3">Add Feedback (optional)</label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us about your experience with this worker..."
            rows={5}
            className="w-full px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 resize-none"
          />
        </Card>

        <Card className="bg-[#F4C430]/10 border-[#F4C430]/30">
          <p className="text-sm text-white/80 text-center">
            Your feedback helps us maintain quality service and assists other users in making
            informed decisions
          </p>
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
