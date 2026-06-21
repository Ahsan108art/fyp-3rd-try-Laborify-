import { useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../utils/api";
import { motion } from "motion/react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { DollarSign, Clock } from "lucide-react";

export function SetChargesScreen() {
  const navigate = useNavigate();
  const [hourlyRate, setHourlyRate] = useState("");
  const [fixedPrice, setFixedPrice] = useState("");
  const [minDuration, setMinDuration] = useState("1");
  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/workers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ chargePerHour: parseFloat(hourlyRate) || 0 }),
      });
    } catch {
      // ignore — proceed even if save fails
    } finally {
      setSaving(false);
      navigate("/location-setup");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Set Your Charges</h1>
        <p className="text-white/60">Define your pricing</p>
        <div className="flex gap-2 mt-6">
          <div className="h-1 flex-1 bg-[#F4C430] rounded-full" />
          <div className="h-1 flex-1 bg-[#F4C430] rounded-full" />
          <div className="h-1 flex-1 bg-[#F4C430] rounded-full" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 space-y-6"
      >
        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Hourly Rate</h3>
          <Input
            placeholder="Enter hourly rate"
            type="number"
            value={hourlyRate}
            onChange={setHourlyRate}
            icon={<DollarSign size={20} />}
          />
        </div>

        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Fixed Price (Optional)</h3>
          <Input
            placeholder="Enter fixed price"
            type="number"
            value={fixedPrice}
            onChange={setFixedPrice}
            icon={<DollarSign size={20} />}
          />
        </div>

        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
          <h3 className="text-lg font-semibold text-white mb-4">Minimum Duration</h3>
          <div className="grid grid-cols-4 gap-3">
            {["1", "2", "3", "4"].map((hrs) => (
              <button
                key={hrs}
                onClick={() => setMinDuration(hrs)}
                className={`
                  py-3 rounded-xl font-medium transition-all
                  ${
                    minDuration === hrs
                      ? "bg-[#F4C430] text-[#0B1C2C]"
                      : "bg-white/5 text-white border border-white/10"
                  }
                `}
              >
                {hrs}h
              </button>
            ))}
          </div>
        </div>

        <div className="p-5 bg-[#F4C430]/10 rounded-2xl border border-[#F4C430]/30">
          <div className="flex items-start gap-3">
            <Clock size={20} className="text-[#F4C430] mt-0.5" />
            <div>
              <p className="text-sm text-white/80">
                Estimated earnings for {minDuration}h minimum:{" "}
                <span className="text-[#F4C430] font-bold">
                  Rs {(Number(hourlyRate) * Number(minDuration) || 0).toFixed(2)}
                </span>
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-6"
      >
        <Button variant="primary" fullWidth onClick={handleNext} disabled={saving}>
          {saving ? "Saving..." : "Next"}
        </Button>
      </motion.div>
    </div>
  );
}
