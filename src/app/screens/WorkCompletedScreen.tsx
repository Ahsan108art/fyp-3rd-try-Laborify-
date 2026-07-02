import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { CheckCircle, Briefcase, Clock, Banknote } from "lucide-react";

export function WorkCompletedScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const worker = state?.worker;
  const earnings = state?.earnings || 0;
  const elapsed = state?.elapsed || 0; // seconds
  const jobId = state?.jobId;

  const hours = Math.floor(elapsed / 3600);
  const minutes = Math.floor((elapsed % 3600) / 60);
  const seconds = elapsed % 60;
  const durationText = hours > 0 ? `${hours}h ${minutes}m` : minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;

  const workerName = worker?.name || "Worker";
  const workerSkill = worker?.skills?.[0] || "Specialist";
  const pricePerHour = worker?.pricePerHour || worker?.chargePerHour || 0;

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="flex justify-center mb-8"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#F4C430] to-[#D4A820] flex items-center justify-center shadow-xl shadow-[#F4C430]/20">
          <CheckCircle size={48} className="text-[#0B1C2C]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Work Completed!</h1>
        <p className="text-white/60">Your job has been finished</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Job Summary</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Briefcase size={20} className="text-[#F4C430] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-1">Service Type</p>
                <p className="text-white font-medium">{workerSkill}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-[#F4C430] mt-0.5" />
              <div className="flex-1">
                <p className="text-sm text-white/60 mb-1">Duration</p>
                <p className="text-white font-medium">{durationText}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Worker</h3>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center">
              <span className="text-xl">ðŸ‘¤</span>
            </div>
            <div>
              <p className="text-lg font-semibold text-white">{workerName}</p>
              <p className="text-sm text-white/60">{workerSkill}</p>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-[#F4C430]/10 to-[#D4A820]/10 border-[#F4C430]/30">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold text-white">Total Cost</h3>
            <Banknote size={20} className="text-[#F4C430]" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-white/70">
              <span>Rate: Rs {pricePerHour}/hr</span>
              <span>Rs {earnings}</span>
            </div>
            <div className="h-px bg-white/20 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-white">Total Amount</span>
              <span className="text-3xl font-bold text-[#F4C430]">Rs {earnings}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="mt-8"
      >
        <Button variant="primary" fullWidth onClick={() => navigate("/payment", { state: { worker, jobId, earnings } })}>
          Mark as Paid
        </Button>
      </motion.div>
    </div>
  );
}
