import { motion } from "motion/react";
import { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  fullWidth?: boolean;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  fullWidth = false,
  type = "button",
  disabled = false,
  className = "",
}: ButtonProps) {
  const baseStyles =
    "px-6 py-3.5 rounded-2xl font-medium transition-all duration-200 flex items-center justify-center gap-2";

  const variantStyles = {
    primary: "bg-[#F4C430] text-[#0B1C2C] hover:bg-[#F9D96B] active:scale-[0.98]",
    secondary: "bg-[#162D42] text-white hover:bg-[#1A3A52] active:scale-[0.98]",
    outline: "border-2 border-[#F4C430] text-[#F4C430] hover:bg-[#F4C430] hover:text-[#0B1C2C] active:scale-[0.98]",
    ghost: "text-white hover:bg-white/10 active:scale-[0.98]"
  };

  const widthClass = fullWidth ? "w-full" : "";
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "";

  return (
    <motion.button
      whileTap={disabled ? {} : { scale: 0.98 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variantStyles[variant]} ${widthClass} ${disabledStyles} ${className}`}
    >
      {children}
    </motion.button>
  );
}
