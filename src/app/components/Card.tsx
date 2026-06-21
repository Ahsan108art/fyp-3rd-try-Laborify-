import { ReactNode } from "react";
import { motion } from "motion/react";

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function Card({ children, className = "", onClick, hoverable = false }: CardProps) {
  const Component = onClick ? motion.div : "div";

  return (
    <Component
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.02, y: -2 } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      className={`
        bg-[#162D42] rounded-2xl p-5 border border-white/10
        ${onClick ? "cursor-pointer" : ""}
        ${className}
      `}
    >
      {children}
    </Component>
  );
}
