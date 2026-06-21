import { motion } from "motion/react";

interface ToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label?: string;
}

export function Toggle({ enabled, onChange, label }: ToggleProps) {
  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => onChange(!enabled)}
        className={`
          relative w-14 h-8 rounded-full transition-colors duration-200
          ${enabled ? "bg-[#F4C430]" : "bg-white/10"}
        `}
      >
        <motion.div
          animate={{ x: enabled ? 26 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className={`
            absolute top-1 w-6 h-6 rounded-full
            ${enabled ? "bg-[#0B1C2C]" : "bg-white/50"}
          `}
        />
      </button>
      {label && (
        <span className={`text-sm font-medium ${enabled ? "text-[#F4C430]" : "text-white/50"}`}>
          {label}
        </span>
      )}
    </div>
  );
}
