import { motion } from "motion/react";
import { useNavigate } from "react-router";
import { Button } from "../components/Button";
import { CheckCircle, User } from "lucide-react";

export function ProfileCreatedScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <div className="relative">
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#F4C430] to-[#D4A820] flex items-center justify-center">
            <CheckCircle size={64} className="text-[#0B1C2C]" />
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3 }}
            className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full bg-[#162D42] border-4 border-[#0B1C2C] flex items-center justify-center"
          >
            <User size={24} className="text-[#F4C430]" />
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-center mb-12"
      >
        <h1 className="text-3xl font-bold text-white mb-3">Profile Created!</h1>
        <p className="text-lg text-white/60">
          You're all set to start working
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-sm space-y-4"
      >
        <Button variant="primary" fullWidth onClick={() => navigate("/labor-dashboard")}>
          Start Working
        </Button>
        <Button variant="outline" fullWidth onClick={() => navigate("/personal-info")}>
          Edit Profile
        </Button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 p-5 bg-white/5 rounded-2xl border border-white/10 max-w-sm"
      >
        <p className="text-sm text-white/70 text-center">
          💡 Tip: Keep your profile updated to get more job requests
        </p>
      </motion.div>
    </div>
  );
}
