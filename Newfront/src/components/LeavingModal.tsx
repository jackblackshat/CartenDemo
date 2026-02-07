import { useState } from "react";
import { MapPin, Trophy, X } from "lucide-react";

interface LeavingModalProps {
  onClose: () => void;
}

export default function LeavingModal({ onClose }: LeavingModalProps) {
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds

  // Step 1: When leaving?
  if (step === 1) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50">
        <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#4A4F55]">When are you leaving?</h2>
            <button onClick={onClose} className="text-[#8A8D91] hover:text-[#7FA98E]">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            {[
              { label: "Now", value: 0 },
              { label: "2 min", value: 2 },
              { label: "5 min", value: 5 },
              { label: "10 min", value: 10 },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setStep(2)}
                className="w-full py-4 rounded-2xl bg-[#F5F1E8] border border-[#D3D5D7] hover:border-[#7FA98E] transition-all text-lg font-semibold text-[#4A4F55]"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Confirm location
  if (step === 2) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end z-50">
        <div className="w-full bg-white rounded-t-3xl p-6 animate-slide-up shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-[#4A4F55]">Confirm your spot</h2>
            <button onClick={onClose} className="text-[#8A8D91] hover:text-[#7FA98E]">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Map Preview */}
          <div className="relative h-48 bg-gradient-to-br from-[#E8EDE8] to-[#F5F1E8] rounded-2xl mb-4 overflow-hidden border border-[#D3D5D7]">
            <div className="absolute inset-0 flex items-center justify-center">
              <MapPin className="w-16 h-16 text-[#7FA98E]" fill="#7FA98E" />
            </div>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: 'linear-gradient(#7FA98E 1px, transparent 1px), linear-gradient(90deg, #7FA98E 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
          </div>

          <div className="bg-[#F5F1E8] rounded-2xl p-4 mb-6 border border-[#D3D5D7]">
            <p className="font-semibold mb-1 text-[#4A4F55]">Market Street</p>
            <p className="text-sm text-[#8A8D91]">Between 5th & 6th Ave</p>
          </div>

          {/* Earn Credits Badge */}
          <div className="bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] rounded-2xl p-4 mb-6 flex items-center gap-3 shadow-md">
            <Trophy className="w-8 h-8 text-white" />
            <div>
              <p className="font-bold text-white">Earn 10 credits</p>
              <p className="text-sm text-white/90">Help others find parking</p>
            </div>
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-semibold text-lg shadow-md"
          >
            Confirm & Share
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Countdown
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-6">
      <div className="w-full max-w-sm bg-white rounded-3xl p-8 text-center shadow-2xl">
        <h2 className="text-2xl font-semibold mb-8 text-[#4A4F55]">Leaving soon</h2>

        {/* Circular Countdown */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="#D3D5D7"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="96"
              cy="96"
              r="88"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 88}`}
              strokeDashoffset={`${2 * Math.PI * 88 * (1 - timeLeft / 300)}`}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#8B9D83" />
                <stop offset="100%" stopColor="#7FA98E" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-bold text-[#4A4F55]">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}
            </span>
            <span className="text-sm text-[#8A8D91] mt-1">remaining</span>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-semibold shadow-md"
          >
            I've left
          </button>
          <button
            onClick={() => setStep(1)}
            className="w-full py-4 rounded-2xl bg-[#F5F1E8] border border-[#D3D5D7] text-[#4A4F55] font-semibold"
          >
            Need more time
          </button>
        </div>
      </div>
    </div>
  );
}