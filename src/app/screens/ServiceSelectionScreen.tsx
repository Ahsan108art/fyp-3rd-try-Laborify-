import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { Check, ArrowLeft } from "lucide-react";

const categoryServices: Record<string, { id: string, name: string, icon: string }[]> = {
  "Electrician": [
    { id: "wiring", name: "Wiring", icon: "🔌" },
    { id: "lighting", name: "Light Fitting", icon: "💡" },
    { id: "switch", name: "Switch Repair", icon: "🎛️" },
    { id: "ac", name: "AC Repair", icon: "❄️" },
    { id: "heater", name: "Heater Repair", icon: "🔥" },
  ],
  "Plumber": [
    { id: "leak", name: "Pipe Leak", icon: "💧" },
    { id: "toilet", name: "Toilet Repair", icon: "🚽" },
    { id: "faucet", name: "Faucet Fix", icon: "🚰" },
    { id: "water-heater", name: "Water Heater", icon: "♨️" },
    { id: "drain", name: "Drain Cleaning", icon: "🌊" },
  ],
  "Carpenter": [
    { id: "assembly", name: "Furniture Assembly", icon: "🪑" },
    { id: "door", name: "Door Repair", icon: "🚪" },
    { id: "cabinet", name: "Cabinet Making", icon: "🗄️" },
    { id: "polish", name: "Wood Polishing", icon: "✨" },
    { id: "locks", name: "Fixing Locks", icon: "🔒" },
  ],
  "Painter": [
    { id: "wall", name: "Wall Painting", icon: "🎨" },
    { id: "ceiling", name: "Ceiling Painting", icon: "🖌️" },
    { id: "outdoor", name: "Outdoor Painting", icon: "🏡" },
    { id: "wallpaper", name: "Wallpapering", icon: "🖼️" },
    { id: "texture", name: "Texture", icon: "🌈" },
  ],
  "Welder": [
    { id: "gate", name: "Gate Welding", icon: "⛩️" },
    { id: "grill", name: "Window Grill", icon: "🪟" },
    { id: "repair", name: "General Repair", icon: "🔧" },
  ],
  "Mason": [
    { id: "wall", name: "Wall Building", icon: "🧱" },
    { id: "plaster", name: "Plastering", icon: "🏗️" },
    { id: "tiles", name: "Tile Laying", icon: "⬜" },
  ],
  "Gardener": [
    { id: "lawn-mowing", name: "Lawn Mowing", icon: "🌱" },
    { id: "tree-trimming", name: "Tree Trimming", icon: "🌳" },
    { id: "yard-cleaning", name: "Yard Cleaning", icon: "🧹" },
    { id: "planting", name: "Planting", icon: "🌿" },
    { id: "weeding", name: "Weeding", icon: "🪴" },
    { id: "fertilizing", name: "Fertilizing", icon: "💧" },
  ],
  "Cleaner": [
    { id: "deep", name: "Deep Cleaning", icon: "✨" },
    { id: "sofa", name: "Sofa Cleaning", icon: "🛋️" },
    { id: "carpet", name: "Carpet Cleaning", icon: "🧹" },
  ],
  "AC Technician": [
    { id: "install", name: "AC Installation", icon: "❄️" },
    { id: "service", name: "AC Servicing", icon: "🔧" },
    { id: "gas", name: "Gas Refill", icon: "💨" },
  ],
  "Mechanic": [
    { id: "car", name: "Car Repair", icon: "🚗" },
    { id: "bike", name: "Bike Repair", icon: "🏍️" },
    { id: "battery", name: "Battery Jump", icon: "🔋" },
  ],
};

export function ServiceSelectionScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const category = (location.state as any)?.category || "Gardener";
  const services = categoryServices[category] || categoryServices["Gardener"];
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const toggleService = (serviceId: string) => {
    if (selectedServices.includes(serviceId)) {
      setSelectedServices(selectedServices.filter((id) => id !== serviceId));
    } else {
      setSelectedServices([...selectedServices, serviceId]);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center"
          >
            <ArrowLeft size={18} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">Select Services</h1>
            <p className="text-white/60 text-sm">What do you need help with?</p>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        {services.map((service, index) => {
          const isSelected = selectedServices.includes(service.id);

          return (
            <motion.button
              key={service.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => toggleService(service.id)}
              className={`
                relative p-6 rounded-2xl transition-all border-2
                ${
                  isSelected
                    ? "bg-[#F4C430] border-[#F4C430]"
                    : "bg-white/5 border-white/10 hover:border-[#F4C430]/50"
                }
              `}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-3 right-3 w-6 h-6 rounded-full bg-[#0B1C2C] flex items-center justify-center"
                >
                  <Check size={14} className="text-[#F4C430]" />
                </motion.div>
              )}
              <div className="text-4xl mb-3">{service.icon}</div>
              <p
                className={`font-semibold text-sm ${
                  isSelected ? "text-[#0B1C2C]" : "text-white"
                }`}
              >
                {service.name}
              </p>
            </motion.button>
          );
        })}
      </motion.div>

      {selectedServices.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-white/5 rounded-2xl border border-white/10"
        >
          <p className="text-sm text-white/60 mb-2">Selected Services:</p>
          <div className="flex flex-wrap gap-2">
            {selectedServices.map((serviceId) => {
              const service = services.find((s) => s.id === serviceId);
              return (
                <span
                  key={serviceId}
                  className="px-3 py-1.5 bg-[#F4C430] text-[#0B1C2C] rounded-full text-sm font-medium"
                >
                  {service?.name}
                </span>
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          variant="primary"
          fullWidth
          onClick={() => navigate("/add-job-details", { state: { ...(location.state as any), category, selectedServices } })}
          disabled={selectedServices.length === 0}
        >
          Next ({selectedServices.length} selected)
        </Button>
      </motion.div>
    </div>
  );
}
