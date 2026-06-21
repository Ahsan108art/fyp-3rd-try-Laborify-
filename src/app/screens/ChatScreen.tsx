import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { ArrowLeft, Send, MapPin, Phone } from "lucide-react";

const initialMessages = [
  { id: 1, text: "Hi! I accepted your job request", sender: "me", time: "2:30 PM" },
  { id: 2, text: "Great! When can you come?", sender: "them", time: "2:31 PM" },
  { id: 3, text: "I can be there in 20 minutes", sender: "me", time: "2:32 PM" },
  { id: 4, text: "Perfect! See you soon", sender: "them", time: "2:33 PM" },
];

export function ChatScreen() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  const sendMessage = () => {
    if (newMessage.trim()) {
      setMessages([
        ...messages,
        {
          id: messages.length + 1,
          text: newMessage,
          sender: "me",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setNewMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1C2C] flex flex-col">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#162D42] border-b border-white/10 px-6 py-4"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/labor-dashboard")}
            className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">John Doe</h2>
            <p className="text-sm text-white/50">Active now</p>
          </div>
          <div className="flex gap-2">
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <Phone size={18} className="text-[#F4C430]" />
            </button>
            <button className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
              <MapPin size={18} className="text-[#F4C430]" />
            </button>
          </div>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {messages.map((message, index) => (
          <motion.div
            key={message.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`flex ${message.sender === "me" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl ${
                message.sender === "me"
                  ? "bg-[#F4C430] text-[#0B1C2C] rounded-br-md"
                  : "bg-[#162D42] text-white rounded-bl-md"
              }`}
            >
              <p className="text-sm">{message.text}</p>
              <p
                className={`text-xs mt-1 ${
                  message.sender === "me" ? "text-[#0B1C2C]/60" : "text-white/50"
                }`}
              >
                {message.time}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#162D42] border-t border-white/10 px-6 py-4"
      >
        <div className="flex gap-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#F4C430]/50"
          />
          <button
            onClick={sendMessage}
            className="w-12 h-12 rounded-2xl bg-[#F4C430] flex items-center justify-center hover:bg-[#F9D96B] transition-all active:scale-95"
          >
            <Send size={20} className="text-[#0B1C2C]" />
          </button>
        </div>
        <button
          onClick={() => navigate("/job-in-progress")}
          className="w-full mt-3 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all"
        >
          Confirm Availability & Start Job
        </button>
      </motion.div>
    </div>
  );
}
