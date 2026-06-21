// Laborify Design System Colors
export const colors = {
  // Primary Colors
  navy: "#0B1C2C",
  navyLight: "#162D42",
  navyDark: "#050E17",
  yellow: "#F4C430",
  yellowDark: "#D4A820",
  yellowLight: "#F9D96B",

  // Semantic Colors
  background: "#0B1C2C",
  foreground: "#FFFFFF",
  muted: "#1A3A52",
  mutedForeground: "#8B9BAB",
  border: "rgba(255, 255, 255, 0.1)",

  // Status Colors
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
} as const;

export const gradients = {
  primary: "from-[#F4C430] to-[#D4A820]",
  secondary: "from-[#0B1C2C] to-[#162D42]",
  accent: "from-[#F4C430]/10 to-[#D4A820]/10",
} as const;
