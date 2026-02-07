import { X } from "lucide-react";

interface DurationModalProps {
  onClose: () => void;
  currentDuration: string;
  onSelect: (duration: string) => void;
}

const durations = ["None", "30 min", "1 hour", "2 hours", "4 hours", "All day"];

export default function DurationModal({ onClose, currentDuration, onSelect }: DurationModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end z-50">
      <div className="w-full bg-white rounded-t-3xl p-6 max-h-[70vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[#4A4F55]">Default Duration</h2>
          <button onClick={onClose} className="text-[#8A8D91] hover:text-[#7FA98E] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-sm text-[#8A8D91] mb-4">
          Set how long you typically park. This helps us find the best spots for you.
        </p>

        <div className="space-y-2">
          {durations.map((duration) => (
            <button
              key={duration}
              onClick={() => {
                onSelect(duration);
                onClose();
              }}
              className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                currentDuration === duration
                  ? "border-[#7FA98E] bg-[#7FA98E]/10"
                  : "border-[#D3D5D7] bg-white hover:border-[#7FA98E]/50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`font-medium ${
                  currentDuration === duration ? "text-[#7FA98E]" : "text-[#4A4F55]"
                }`}>
                  {duration}
                </span>
                {currentDuration === duration && (
                  <div className="w-5 h-5 rounded-full bg-[#7FA98E] flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
              {duration === "None" && (
                <p className="text-xs text-[#8A8D91] mt-1">Show all spots regardless of time limits</p>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
