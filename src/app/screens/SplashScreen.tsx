import { motion } from "motion/react";
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { Hammer } from "lucide-react";

export function SplashScreen() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col items-center justify-center px-6">
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="mb-8"
      >
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#F4C430] to-[#D4A820] flex items-center justify-center shadow-2xl shadow-[#F4C430]/20">
          <Hammer size={48} className="text-[#0B1C2C]" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-5xl font-bold text-white mb-3"
      >
        Laborify
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-lg text-white/60 text-center"
      >
        Hire trusted labor near you
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, repeat: Infinity, duration: 1.5, repeatType: "reverse" }}
        className="mt-12 flex gap-2"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{
              delay: i * 0.2,
              duration: 0.8,
              repeat: Infinity,
              repeatType: "reverse",
            }}
            className="w-2 h-2 rounded-full bg-[#F4C430]"
          />
        ))}
      </motion.div>
    </div>
  );
}
