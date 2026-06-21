import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { SkillChip } from "../components/SkillChip";
import { Wrench } from "lucide-react";
import { API_URL } from "../utils/api";

const availableSkills = [
  "Electrician",
  "Plumber",
  "Carpenter",
  "Painter",
  "Welder",
  "Mason",
  "Gardener",
  "Cleaner",
  "AC Technician",
  "Mechanic",
];

export function SkillsSelectionScreen() {
  const navigate = useNavigate();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const [saving, setSaving] = useState(false);

  const handleNext = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      await fetch(`${API_URL}/api/workers/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ skills: selectedSkills }),
      });
    } catch {
      // proceed even if it fails (network error)
    } finally {
      setSaving(false);
      navigate("/set-charges");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-[#F4C430]/20 flex items-center justify-center">
            <Wrench size={24} className="text-[#F4C430]" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Select Skills</h1>
            <p className="text-white/60">Choose your expertise</p>
          </div>
        </div>
        <div className="flex gap-2 mt-6">
          <div className="h-1 flex-1 bg-[#F4C430] rounded-full" />
          <div className="h-1 flex-1 bg-[#F4C430] rounded-full" />
          <div className="h-1 flex-1 bg-white/10 rounded-full" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1"
      >
        <div className="flex flex-wrap gap-3">
          {availableSkills.map((skill, index) => (
            <motion.div
              key={skill}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
            >
              <SkillChip
                label={skill}
                selected={selectedSkills.includes(skill)}
                onToggle={() => toggleSkill(skill)}
              />
            </motion.div>
          ))}
        </div>

        {selectedSkills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 p-4 bg-white/5 rounded-2xl border border-white/10"
          >
            <p className="text-sm text-white/60 mb-2">Selected Skills:</p>
            <div className="flex flex-wrap gap-2">
              {selectedSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1.5 bg-[#F4C430] text-[#0B1C2C] rounded-full text-sm font-medium"
                >
                  {skill}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="pt-6"
      >
        <Button
          variant="primary"
          fullWidth
          onClick={handleNext}
          disabled={selectedSkills.length === 0 || saving}
        >
          {saving ? "Saving..." : `Next (${selectedSkills.length} selected)`}
        </Button>
      </motion.div>
    </div>
  );
}
