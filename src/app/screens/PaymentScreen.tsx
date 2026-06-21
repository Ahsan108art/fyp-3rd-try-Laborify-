import { useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { DollarSign, CreditCard, Smartphone, Check } from "lucide-react";

const paymentMethods = [
  { id: "cash", name: "Cash", icon: DollarSign, description: "Pay in cash" },
  { id: "jazzcash", name: "JazzCash", icon: Smartphone, description: "Mobile wallet" },
  { id: "card", name: "Credit Card", icon: CreditCard, description: "Pay with card" },
];

export function PaymentScreen() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const worker = state?.worker;
  const earnings = state?.earnings || 0;
  const jobId = state?.jobId;

  const handlePayment = () => {
    navigate("/rate-labor", { state: { worker, jobId, earnings } });
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] px-6 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold text-white mb-2">Payment</h1>
        <p className="text-white/60">Choose payment method</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <Card className="bg-gradient-to-br from-[#F4C430]/10 to-[#D4A820]/10 border-[#F4C430]/30">
          <div className="text-center">
            <p className="text-sm text-white/60 mb-2">Amount to Pay</p>
            <p className="text-4xl font-bold text-[#F4C430]">Rs {earnings}</p>
          </div>
        </Card>

        <div>
          <h3 className="text-lg font-semibold text-white mb-4">Select Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method, index) => {
              const Icon = method.icon;
              const isSelected = selectedMethod === method.id;

              return (
                <motion.button
                  key={method.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 + index * 0.05 }}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`
                    w-full p-5 rounded-2xl transition-all border-2
                    ${
                      isSelected
                        ? "bg-[#F4C430]/20 border-[#F4C430]"
                        : "bg-white/5 border-white/10 hover:border-[#F4C430]/50"
                    }
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        isSelected ? "bg-[#F4C430]" : "bg-white/10"
                      }`}
                    >
                      <Icon
                        size={24}
                        className={isSelected ? "text-[#0B1C2C]" : "text-[#F4C430]"}
                      />
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`font-semibold ${isSelected ? "text-white" : "text-white"}`}>
                        {method.name}
                      </p>
                      <p className="text-sm text-white/60">{method.description}</p>
                    </div>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-6 h-6 rounded-full bg-[#F4C430] flex items-center justify-center"
                      >
                        <Check size={14} className="text-[#0B1C2C]" />
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        <Card>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-white/70">
              <span>Service Cost</span>
              <span>Rs {earnings}</span>
            </div>
            <div className="flex justify-between text-white/70">
              <span>Platform Fee</span>
              <span>Rs 0.00</span>
            </div>
            <div className="h-px bg-white/10 my-2" />
            <div className="flex justify-between text-white font-semibold">
              <span>Total</span>
              <span className="text-[#F4C430]">Rs {earnings}</span>
            </div>
          </div>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-8"
      >
        <Button
          variant="primary"
          fullWidth
          onClick={handlePayment}
          disabled={!selectedMethod}
        >
          Mark as Paid
        </Button>
      </motion.div>
    </div>
  );
}
