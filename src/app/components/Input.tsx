import { ReactNode } from "react";

interface InputProps {
  label?: string;
  placeholder?: string;
  type?: string;
  value?: string;
  onChange?: (value: string) => void;
  icon?: ReactNode;
  error?: string;
  fullWidth?: boolean;
  className?: string;
}

export function Input({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
  icon,
  error,
  fullWidth = true,
  className = "",
}: InputProps) {
  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      {label && (
        <label className="block text-sm text-white/70 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
            {icon}
          </div>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          className={`
            w-full px-4 py-3.5 rounded-2xl
            bg-white/5 border border-white/10
            text-white placeholder:text-white/30
            focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50 focus:border-[#F4C430]/50
            transition-all duration-200
            ${icon ? "pl-12" : ""}
          `}
        />
      </div>
      {error && (
        <p className="mt-1.5 text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
