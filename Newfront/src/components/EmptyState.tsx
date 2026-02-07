import { useNavigate } from "react-router";
import { MapPin, Bell, Clock } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function EmptyState() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();

  return (
    <div className={`h-full flex items-center justify-center p-6 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      <div className="max-w-sm text-center">
        {/* Illustration */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-[#B87C7C]/20 rounded-full blur-3xl" />
          <div className="relative w-full h-full flex items-center justify-center">
            <MapPin
              className="w-24 h-24 text-[#B87C7C]"
              strokeWidth={1.5}
            />
          </div>
        </div>

        {/* Message */}
        <h2 className={`text-2xl font-bold mb-3 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
          No free spots nearby
        </h2>
        <p className={`mb-8 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
          All street parking is currently occupied in this area.
          Check out paid options or get notified when spots open
          up.
        </p>

        {/* Prediction */}
        <div className={`rounded-2xl p-4 border mb-6 shadow-sm ${
          isDark ? 'bg-[#2C2C2E] border-[#3A3A3C]' : 'bg-white border-[#D3D5D7]'
        }`}>
          <div className="flex items-center justify-center gap-2 text-[#C9A96E]">
            <Clock className="w-5 h-5" />
            <span className="text-sm font-medium">
              Usually opens in ~12 mins
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={() => navigate("/garage/1")}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-semibold shadow-md"
          >
            Try paid parking
          </button>

          <button className={`w-full py-4 rounded-2xl border font-semibold flex items-center justify-center gap-2 shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C] text-[#F5F5F7]' 
              : 'bg-white border-[#D3D5D7] text-[#4A4F55]'
          }`}>
            <Bell className="w-5 h-5" />
            Notify when open
          </button>
        </div>
      </div>
    </div>
  );
}