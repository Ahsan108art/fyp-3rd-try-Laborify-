import { useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../utils/api";
import { motion } from "motion/react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { User, Phone, Lock } from "lucide-react";

export function SignupScreen() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isLabor, setIsLabor] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: fullName,
          phoneNumber,
          password,
          role: isLabor ? "labor" : "user"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      const role = isLabor ? "labor" : "user";
      localStorage.setItem("userType", role);
      localStorage.setItem("userRole", role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user?.name || fullName);
      localStorage.setItem("userId", data.user?.id || "");
      localStorage.setItem("userPhone", data.user?.phoneNumber || "");
      navigate("/personal-info");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
        <p className="text-white/60">Join Laborify and get started</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 space-y-5"
      >
        <Input
          label="Full Name"
          placeholder="Enter your full name"
          value={fullName}
          onChange={setFullName}
          icon={<User size={20} />}
        />

        <Input
          label="Phone Number"
          placeholder="Enter phone number"
          type="tel"
          value={phoneNumber}
          onChange={setPhoneNumber}
          icon={<Phone size={20} />}
        />

        <Input
          label="Password"
          placeholder="Create password"
          type="password"
          value={password}
          onChange={setPassword}
          icon={<Lock size={20} />}
        />

        <div className="pt-4">
          <button
            onClick={() => setIsLabor(!isLabor)}
            className="flex items-center gap-3 w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#F4C430]/50 transition-all"
          >
            <div
              className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                isLabor ? "bg-[#F4C430] border-[#F4C430]" : "border-white/30"
              }`}
            >
              {isLabor && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-3 h-3 bg-[#0B1C2C] rounded-sm"
                />
              )}
            </div>
            <span className="text-white/80">Sign up as Labor</span>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="space-y-4 pt-6"
      >
        {error && (
          <div className="text-red-500 text-sm font-medium text-center">{error}</div>
        )}
        <Button variant="primary" fullWidth onClick={handleSignup} disabled={loading}>
          {loading ? "Signing up..." : "Sign Up"}
        </Button>

        <p className="text-center text-white/60">
          Already have an account?{" "}
          <button
            onClick={() => navigate("/login")}
            className="text-[#F4C430] font-medium hover:underline"
          >
            Login
          </button>
        </p>
      </motion.div>
    </div>
  );
}
