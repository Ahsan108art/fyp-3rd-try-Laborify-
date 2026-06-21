import { useState } from "react";
import { useNavigate } from "react-router";
import { API_URL } from "../utils/api";
import { motion } from "motion/react";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { Phone, Lock, Hammer } from "lucide-react";

export function LoginScreen() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber, password })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }
      localStorage.setItem("userType", data.user.role);
      localStorage.setItem("userRole", data.user.role);
      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.name || "User");
      localStorage.setItem("userId", data.user.id || "");
      localStorage.setItem("userPhone", data.user.phoneNumber || "");

      if (data.user.role === "labor") {
        navigate("/labor-dashboard");
      } else {
        navigate("/find-worker");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col px-6 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex justify-center mb-8"
      >
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#F4C430] to-[#D4A820] flex items-center justify-center shadow-xl shadow-[#F4C430]/20">
          <Hammer size={40} className="text-[#0B1C2C]" />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
        <p className="text-white/60">Login to continue</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 space-y-5"
      >
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
          placeholder="Enter password"
          type="password"
          value={password}
          onChange={setPassword}
          icon={<Lock size={20} />}
        />

        <div className="flex justify-end">
          <button className="text-sm text-[#F4C430] hover:underline">
            Forgot Password?
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
        <Button variant="primary" fullWidth onClick={handleLogin} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>

        <p className="text-center text-white/60">
          Don't have account?{" "}
          <button
            onClick={() => navigate("/signup")}
            className="text-[#F4C430] font-medium hover:underline"
          >
            Create Account
          </button>
        </p>
      </motion.div>
    </div>
  );
}
