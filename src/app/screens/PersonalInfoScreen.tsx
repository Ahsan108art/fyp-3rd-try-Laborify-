import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { User, Calendar, MapPin } from "lucide-react";

export function PersonalInfoScreen() {
  const navigate = useNavigate();
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [address, setAddress] = useState("");

  const handleNext = () => {
    const userType = localStorage.getItem("userType");
    if (userType === "labor") {
      navigate("/skills-selection");
    } else {
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
        <h1 className="text-3xl font-bold text-white mb-2">Personal Information</h1>
        <p className="text-white/60">Tell us about yourself</p>
        <div className="flex gap-2 mt-6">
          <div className="h-1 flex-1 bg-[#F4C430] rounded-full" />
          <div className="h-1 flex-1 bg-white/10 rounded-full" />
          <div className="h-1 flex-1 bg-white/10 rounded-full" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 space-y-5"
      >
        <Input
          label="Age"
          placeholder="Enter your age"
          type="number"
          value={age}
          onChange={setAge}
          icon={<Calendar size={20} />}
        />

        <div>
          <label className="block text-sm text-white/70 mb-2">Gender</label>
          <div className="grid grid-cols-3 gap-3">
            {["Male", "Female", "Other"].map((g) => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={`
                  py-3 rounded-2xl font-medium transition-all
                  ${
                    gender === g
                      ? "bg-[#F4C430] text-[#0B1C2C]"
                      : "bg-white/5 text-white border border-white/10 hover:border-[#F4C430]/50"
                  }
                `}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Address"
          placeholder="Enter your address"
          value={address}
          onChange={setAddress}
          icon={<MapPin size={20} />}
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-6"
      >
        <Button variant="primary" fullWidth onClick={handleNext}>
          Next
        </Button>
      </motion.div>
    </div>
  );
}
