import { useState } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, Clock } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function HeatmapView() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [timeOffset, setTimeOffset] = useState(0);

  const timeOptions = [
    { label: "Now", value: 0 },
    { label: "+15m", value: 15 },
    { label: "+30m", value: 30 },
    { label: "+1hr", value: 60 },
  ];

  return (
    <div className={`h-full flex flex-col ${
      isDark 
        ? 'bg-gradient-to-b from-[#7FA98E]/5 to-[#1C1C1E]' 
        : 'bg-gradient-to-b from-[#8FA88E]/10 to-[#F5F1E8]'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b px-4 py-3 ${
        isDark 
          ? 'bg-[#2C2C2E]/95 border-[#3A3A3C]' 
          : 'bg-white/95 border-[#D3D5D7]'
      }`}>
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate("/")}
            className={`w-9 h-9 rounded-full border flex items-center justify-center hover:bg-[#7FA98E] hover:text-white transition-colors ${
              isDark 
                ? 'bg-[#3A3A3C] border-[#48484A]' 
                : 'bg-[#F5F1E8] border-[#D3D5D7]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Availability Heatmap</h1>
        </div>

        {/* Time Slider */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {timeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeOffset(option.value)}
              className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${
                timeOffset === option.value
                  ? "bg-[#7FA98E] text-white"
                  : isDark 
                    ? "bg-[#3A3A3C] text-[#AEAEB2] border border-[#48484A]"
                    : "bg-[#F5F1E8] text-[#8A8D91] border border-[#D3D5D7]"
              }`}
            >
              <Clock className="w-3 h-3 inline mr-1" />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Heatmap */}
      <div className={`flex-1 relative ${isDark ? 'bg-[#2C2C2E]' : 'bg-[#E8DFD0]'}`}>
        {/* Grid background */}
        <div className={`absolute inset-0 ${isDark ? 'opacity-5' : 'opacity-10'}`} style={{
          backgroundImage: isDark 
            ? 'linear-gradient(#F5F5F7 1px, transparent 1px), linear-gradient(90deg, #F5F5F7 1px, transparent 1px)' 
            : 'linear-gradient(#8A8D91 1px, transparent 1px), linear-gradient(90deg, #8A8D91 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* Heatmap zones */}
        <div className="absolute inset-0">
          {/* High availability - Sage Green */}
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#7FA98E] rounded-full blur-3xl opacity-40 animate-pulse" />
          <div className="absolute top-1/3 left-1/3 w-48 h-48 bg-[#7FA98E] rounded-full blur-2xl opacity-50" />
          
          {/* Moderate availability - Warm Gold */}
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-[#C9A96E] rounded-full blur-3xl opacity-35 animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 right-1/3 w-56 h-56 bg-[#C9A96E] rounded-full blur-2xl opacity-45" />
          
          {/* Low availability - Muted Rose */}
          <div className="absolute bottom-1/4 left-1/2 w-72 h-72 bg-[#B87C7C] rounded-full blur-3xl opacity-30 animate-pulse" style={{ animationDelay: '2s' }} />
          <div className="absolute bottom-1/3 left-1/2 w-48 h-48 bg-[#B87C7C] rounded-full blur-2xl opacity-40" />

          {/* Additional moderate zones */}
          <div className="absolute top-2/3 left-1/5 w-56 h-56 bg-[#C9A96E] rounded-full blur-3xl opacity-30" />
        </div>

        {/* Legend */}
        <div className={`absolute bottom-32 left-4 right-4 backdrop-blur-xl rounded-2xl p-4 border shadow-lg ${
          isDark 
            ? 'bg-[#2C2C2E]/95 border-[#3A3A3C]' 
            : 'bg-white/95 border-[#D3D5D7]'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-sm font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Availability Legend</span>
            <span className="text-xs text-[#7FA98E]">Based on prediction</span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#7FA98E]" />
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>High availability (70%+)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#C9A96E]" />
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Moderate (30-70%)</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-[#B87C7C]" />
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Low availability (&lt;30%)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Info Banner */}
      <div className={`absolute bottom-4 left-4 right-4 backdrop-blur-xl border rounded-xl p-3 shadow-md z-20 ${
        isDark 
          ? 'bg-[#2C2C2E]/95 border-[#3A3A3C]' 
          : 'bg-white/95 border-[#D3D5D7]'
      }`}>
        <div className="flex items-start gap-2">
          <div className="text-[#7FA98E] mt-0.5 text-lg">ℹ️</div>
          <p className={`text-sm leading-relaxed ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
            Predictions based on historical data, real-time reports, and traffic patterns. 
            {timeOffset > 0 && ` Showing forecast for ${timeOptions.find(o => o.value === timeOffset)?.label}.`}
          </p>
        </div>
      </div>
    </div>
  );
}