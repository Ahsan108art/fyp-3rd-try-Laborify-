import { motion } from "motion/react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
}

export function LoadingSpinner({ size = "md", color = "#F4C430" }: LoadingSpinnerProps) {
  const sizes = {
    sm: 20,
    md: 40,
    lg: 60,
  };

  const spinnerSize = sizes[size];

  return (
    <div className="flex items-center justify-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        style={{ width: spinnerSize, height: spinnerSize }}
      >
        <svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
          <circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="31.4 31.4"
            opacity="0.3"
          />
          <motion.circle
            cx="25"
            cy="25"
            r="20"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="90 150"
          />
        </svg>
      </motion.div>
    </div>
  );
}
