import { useNavigate } from "react-router";
import { Navigation, Camera, Users, TrendingUp, Zap, Clock, ParkingCircle } from "lucide-react";
import GlassCard from "./GlassCard";
import { useDarkMode } from "../context/DarkModeContext.tsx";

interface SpotCardProps {
  spot: {
    id: string;
    street: string;
    distance: string;
    confidence: number;
    type: string;
    status: string;
    timeValid: string;
    timeLimit?: string;
    price?: string;
    sources: string[];
  };
}

export default function SpotCard({ spot }: SpotCardProps) {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();

  const getSourceIcon = (source: string) => {
    switch (source) {
      case "camera": return <Camera className="w-3 h-3" />;
      case "crowd": return <Users className="w-3 h-3" />;
      case "prediction": return <TrendingUp className="w-3 h-3" />;
      case "api": return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <div
      onClick={() => navigate(`/spot/${spot.id}`)}
      className="w-full cursor-pointer"
    >
      <GlassCard variant="light" className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{spot.street}</h3>
              {spot.type === "garage" && (
                <ParkingCircle className="w-4 h-4 text-[#7FA98E]" />
              )}
            </div>
            <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{spot.distance}</p>
          </div>
          
          {/* Confidence Badge */}
          <div className="flex flex-col items-end gap-1">
            <div className="px-3 py-1 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E]">
              <span className="text-sm font-semibold text-[#5F7A61]">{spot.confidence}%</span>
            </div>
            {spot.price && (
              <span className="text-sm font-semibold text-[#7FA98E]">{spot.price}</span>
            )}
          </div>
        </div>

        {/* Data Sources */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5">
            {spot.sources.map((source, i) => (
              <div
                key={i}
                className={`w-6 h-6 rounded-full border flex items-center justify-center text-[#7FA98E] ${
                  isDark 
                    ? 'bg-[#3A3A3C] border-[#48484A]' 
                    : 'bg-[#F5F1E8] border-[#D3D5D7]'
                }`}
              >
                {getSourceIcon(source)}
              </div>
            ))}
          </div>
          <div className={`h-4 w-px ${isDark ? 'bg-[#48484A]' : 'bg-[#D3D5D7]'}`} />
          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
            <Clock className="w-3 h-3" />
            <span>Valid {spot.timeValid}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between">
          <span className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{spot.timeLimit || "No limit"}</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/navigate");
            }}
            className="px-4 py-2 rounded-full bg-[#7FA98E] text-white text-sm font-semibold flex items-center gap-2 hover:bg-[#8B9D83] transition-colors shadow-sm"
          >
            <Navigation className="w-3 h-3" />
            Navigate
          </button>
        </div>
      </GlassCard>
    </div>
  );
}