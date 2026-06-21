import { motion } from "motion/react";
import { X } from "lucide-react";

interface SkillChipProps {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  onRemove?: () => void;
}

export function SkillChip({ label, selected = false, onToggle, onRemove }: SkillChipProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={`
        px-4 py-2.5 rounded-full font-medium text-sm
        transition-all duration-200 flex items-center gap-2
        ${
          selected
            ? "bg-[#F4C430] text-[#0B1C2C]"
            : "bg-white/5 text-white border border-white/20 hover:border-[#F4C430]"
        }
      `}
    >
      {label}
      {selected && onRemove && (
        <X
          size={16}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="cursor-pointer"
        />
      )}
    </motion.button>
  );
}
