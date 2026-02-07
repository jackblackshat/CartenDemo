import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { 
  ArrowLeft, Navigation, Share2, Camera, Users, 
  TrendingUp, MapPin, Clock, AlertCircle, Info, Heart,
  Flag, Database, DollarSign, Calendar, ChevronRight
} from "lucide-react";
import { XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from "recharts";
import GlassCard from "./GlassCard";
import { useDarkMode } from "../context/DarkModeContext.tsx";

// Mock data - would come from API in real app
const spotData = {
  id: "market-st-123",
  name: "Market Street",
  crossStreet: "5th Street",
  distance: "0.2 mi",
  walkTime: "2 min",
  confidence: 94,
  
  sources: [
    {
      type: "camera",
      name: "Street Camera",
      confidence: 98,
      details: "Camera #4521, Market St",
      lastUpdate: "2 min ago",
      icon: Camera,
      color: "#7FA98E"
    },
    {
      type: "crowd",
      name: "Crowd Report",
      confidence: 85,
      details: "Reported by verified user",
      lastUpdate: "10 min ago",
      confirmations: 2,
      icon: Users,
      color: "#8B9D83"
    },
    {
      type: "prediction",
      name: "Prediction Model",
      confidence: 72,
      details: "Based on historical patterns",
      lastUpdate: "Real-time",
      icon: TrendingUp,
      color: "#C9A96E"
    },
    {
      type: "api",
      name: "City Parking Sensor",
      confidence: 91,
      details: "Municipal sensor network",
      lastUpdate: "1 min ago",
      icon: Database,
      color: "#8FA88E"
    }
  ],
  
  rules: {
    timeLimit: "2 hour maximum",
    hours: "Mon-Sat 8AM-6PM",
    permit: "No permit required",
    sweeping: "Wed 8AM-10AM",
    warnings: [
      { text: "Street sweeping tomorrow 8-10 AM", urgent: true },
    ],
    cost: null // Free parking
  },
  
  historicalData: [
    { hour: "6AM", availability: 85 },
    { hour: "7AM", availability: 72 },
    { hour: "8AM", availability: 45 },
    { hour: "9AM", availability: 25 },
    { hour: "10AM", availability: 20 },
    { hour: "11AM", availability: 30 },
    { hour: "12PM", availability: 45 },
    { hour: "1PM", availability: 52 },
    { hour: "2PM", availability: 48 },
    { hour: "3PM", availability: 60 },
    { hour: "4PM", availability: 65 },
    { hour: "5PM", availability: 70 },
    { hour: "6PM", availability: 80 },
    { hour: "7PM", availability: 88 },
    { hour: "8PM", availability: 92 },
    { hour: "9PM", availability: 95 }
  ],
  
  similarSpots: [
    { id: "1", name: "6th Street", distance: "50ft further", confidence: 98, walkTime: "3 min" },
    { id: "2", name: "Mission Street", distance: "0.1 mi", confidence: 82, walkTime: "4 min" },
    { id: "3", name: "Howard Street", distance: "0.15 mi", confidence: 76, walkTime: "5 min" }
  ]
};

export default function SpotDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isDark } = useDarkMode();
  const [saved, setSaved] = useState(false);
  const [expandedChart, setExpandedChart] = useState(false);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "#7FA98E";
    if (confidence >= 70) return "#C9A96E";
    return "#B87C7C";
  };

  const confidenceColor = getConfidenceColor(spotData.confidence);

  return (
    <div className={`h-full flex flex-col overflow-y-auto pb-32 ${
      isDark 
        ? 'bg-gradient-to-b from-[#7FA98E]/5 to-[#1C1C1E]' 
        : 'bg-gradient-to-b from-[#8FA88E]/10 to-[#F5F1E8]'
    }`}>
      {/* Header - Floating back button */}
      <div className="absolute top-4 left-4 z-20">
        <button
          onClick={() => navigate(-1)}
          className={`w-12 h-12 rounded-full backdrop-blur-xl border flex items-center justify-center shadow-lg hover:scale-105 transition-transform ${
            isDark 
              ? 'bg-[#2C2C2E]/95 border-[#3A3A3C]' 
              : 'bg-white/95 border-[#D3D5D7]'
          }`}
        >
          <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`} />
        </button>
      </div>

      {/* Map Preview Hero Section - 40% */}
      <div className={`relative h-[40vh] border-b ${
        isDark 
          ? 'bg-gradient-to-br from-[#2C2C2E] to-[#1C1C1E] border-[#3A3A3C]' 
          : 'bg-gradient-to-br from-[#E8DFD0] to-[#F5F1E8] border-[#D3D5D7]'
      }`}>
        {/* Simulated Map Background */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(127,169,142,0.2)_0%,transparent_70%)]" />
          <svg className="w-full h-full">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(127,169,142,0.2)" strokeWidth="0.5"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>
        
        {/* Pulsing Spot Pin */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Pulse rings */}
            <div className="absolute inset-0 -m-8 rounded-full bg-[#7FA98E] opacity-20 animate-ping" />
            <div className="absolute inset-0 -m-4 rounded-full bg-[#7FA98E] opacity-30 animate-pulse" />
            <MapPin className="w-16 h-16 text-[#7FA98E] drop-shadow-2xl" fill="#7FA98E" />
          </div>
        </div>

        {/* Quick Info Overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <GlassCard variant="light" className="!p-0 overflow-hidden">
            <div className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-2xl font-bold mb-1 text-[#4A4F55]">{spotData.name}</h2>
                  <p className="text-sm text-[#8A8D91]">at {spotData.crossStreet}</p>
                  <div className="flex items-center gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm">
                      <MapPin className="w-4 h-4 text-[#7FA98E]" />
                      <span className="text-[#4A4F55]">{spotData.distance} away</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="w-4 h-4 text-[#7FA98E]" />
                      <span className="text-[#4A4F55]">{spotData.walkTime} walk</span>
                    </div>
                  </div>
                </div>
                
                {/* Confidence Badge */}
                <div className="px-4 py-2 rounded-full border-2" style={{ 
                  backgroundColor: `${confidenceColor}20`,
                  borderColor: confidenceColor
                }}>
                  <span className="text-lg font-bold" style={{ color: confidenceColor }}>
                    {spotData.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Confidence Breakdown Card */}
        <GlassCard variant="light" className="!p-0 overflow-hidden">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-5 flex items-center gap-2 text-[#4A4F55]">
              <TrendingUp className="w-5 h-5 text-[#7FA98E]" />
              Confidence Breakdown
            </h3>

            {/* Overall Score Ring */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-32 h-32">
                {/* Background circle */}
                <svg className="w-32 h-32 transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="rgba(127,169,142,0.15)"
                    strokeWidth="8"
                    fill="none"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke={confidenceColor}
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - spotData.confidence / 100)}`}
                    strokeLinecap="round"
                    style={{ 
                      filter: `drop-shadow(0 0 8px ${confidenceColor}80)`
                    }}
                  />
                </svg>
                {/* Center text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" style={{ color: confidenceColor }}>
                    {spotData.confidence}%
                  </span>
                  <span className="text-xs text-[#8A8D91] mt-1">Confidence</span>
                </div>
              </div>
            </div>

            {/* Source Breakdown */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-[#8A8D91] mb-3">Data Sources</p>
              {spotData.sources.map((source, idx) => {
                const Icon = source.icon;
                return (
                  <div 
                    key={idx}
                    className="group p-3 rounded-xl bg-[#F5F1E8]/50 hover:bg-[#F5F1E8] transition-all cursor-pointer border border-[#D3D5D7]"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{ 
                            backgroundColor: `${source.color}20`,
                            border: `2px solid ${source.color}`
                          }}
                        >
                          <Icon className="w-5 h-5" style={{ color: source.color }} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-[#4A4F55]">{source.name}</p>
                          <p className="text-xs text-[#8A8D91]">{source.details}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold" style={{ color: source.color }}>
                          {source.confidence}%
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#8A8D91] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-[#D3D5D7] rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${source.confidence}%`,
                          backgroundColor: source.color,
                          boxShadow: `0 0 8px ${source.color}80`
                        }}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[#8A8D91]">Last updated: {source.lastUpdate}</p>
                      {source.confirmations && (
                        <p className="text-xs text-[#8A8D91]">{source.confirmations} confirmations</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </GlassCard>

        {/* Street Rules Card */}
        <GlassCard variant="light" className="!p-0 overflow-hidden">
          <div className="p-5">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-[#4A4F55]">
              <Info className="w-5 h-5 text-[#7FA98E]" />
              Street Rules & Restrictions
            </h3>

            {/* Warnings Section */}
            {spotData.rules.warnings.length > 0 && (
              <div className="mb-4 space-y-2">
                {spotData.rules.warnings.map((warning, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-xl bg-[#C9A96E]/10 border border-[#C9A96E]/30"
                  >
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-5 h-5 text-[#C9A96E] mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-[#C9A96E] font-medium">{warning.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rules List */}
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F1E8]/50 border border-[#D3D5D7]">
                <Clock className="w-5 h-5 text-[#7FA98E] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4A4F55]">{spotData.rules.timeLimit}</p>
                  <p className="text-xs text-[#8A8D91] mt-0.5">{spotData.rules.hours}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F1E8]/50 border border-[#D3D5D7]">
                <MapPin className="w-5 h-5 text-[#7FA98E] mt-0.5" />
                <p className="text-sm font-medium text-[#4A4F55]">{spotData.rules.permit}</p>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F1E8]/50 border border-[#D3D5D7]">
                <Calendar className="w-5 h-5 text-[#7FA98E] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-[#4A4F55]">Street Sweeping</p>
                  <p className="text-xs text-[#8A8D91] mt-0.5">{spotData.rules.sweeping}</p>
                </div>
              </div>

              {spotData.rules.cost ? (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#F5F1E8]/50 border border-[#D3D5D7]">
                  <DollarSign className="w-5 h-5 text-[#7FA98E] mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#4A4F55]">{spotData.rules.cost}</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[#7FA98E]/10 border border-[#7FA98E]">
                  <DollarSign className="w-5 h-5 text-[#7FA98E] mt-0.5" />
                  <p className="text-sm font-medium text-[#7FA98E]">Free Parking</p>
                </div>
              )}
            </div>
          </div>
        </GlassCard>

        {/* Historical Availability Card */}
        <GlassCard variant="light" className="!p-0 overflow-hidden">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2 text-[#4A4F55]">
                <TrendingUp className="w-5 h-5 text-[#7FA98E]" />
                Typical Availability
              </h3>
              <button
                onClick={() => setExpandedChart(!expandedChart)}
                className="text-xs text-[#7FA98E] hover:underline font-semibold"
              >
                {expandedChart ? "Collapse" : "View Details"}
              </button>
            </div>

            {/* Sparkline Chart - Compact View */}
            {!expandedChart ? (
              <div className="h-24">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={spotData.historicalData}>
                    <defs>
                      <linearGradient id="availabilityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#7FA98E" stopOpacity={0.3}/>
                        <stop offset="100%" stopColor="#7FA98E" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area 
                      type="monotone" 
                      dataKey="availability" 
                      stroke="#7FA98E" 
                      strokeWidth={2}
                      fill="url(#availabilityGradient)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              /* Expanded Detailed View */
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={spotData.historicalData}>
                      <defs>
                        <linearGradient id="availabilityGradientLarge" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#7FA98E" stopOpacity={0.4}/>
                          <stop offset="100%" stopColor="#7FA98E" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="hour" 
                        tick={{ fill: "#8A8D91", fontSize: 11 }}
                        interval={2}
                      />
                      <YAxis 
                        tick={{ fill: "#8A8D91", fontSize: 11 }}
                        width={35}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.98)",
                          border: "1px solid #D3D5D7",
                          borderRadius: "12px",
                          padding: "8px 12px"
                        }}
                        labelStyle={{ color: "#4A4F55", fontSize: 12 }}
                        itemStyle={{ color: "#7FA98E", fontSize: 12 }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="availability" 
                        stroke="#7FA98E" 
                        strokeWidth={3}
                        fill="url(#availabilityGradientLarge)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="p-3 rounded-xl bg-[#7FA98E]/10 border border-[#7FA98E]">
                  <p className="text-sm text-[#5F7A61]">
                    <span className="font-semibold">Best time:</span> Tuesdays 2-4 PM usually has 85%+ availability
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2 rounded-lg bg-[#F5F1E8] border border-[#D3D5D7] text-center">
                    <p className="text-xs text-[#8A8D91]">Peak Time</p>
                    <p className="text-sm font-semibold text-[#B87C7C]">9-11 AM</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F5F1E8] border border-[#D3D5D7] text-center">
                    <p className="text-xs text-[#8A8D91]">Off-Peak</p>
                    <p className="text-sm font-semibold text-[#7FA98E]">6-8 PM</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#F5F1E8] border border-[#D3D5D7] text-center">
                    <p className="text-xs text-[#8A8D91]">Avg Avail</p>
                    <p className="text-sm font-semibold text-[#C9A96E]">68%</p>
                  </div>
                </div>
              </div>
            )}

            <p className="text-xs text-[#8A8D91] mt-3">Based on last 30 days of data</p>
          </div>
        </GlassCard>

        {/* Similar Spots Section */}
        <div>
          <h3 className="text-lg font-semibold mb-3 px-1 text-[#4A4F55]">Other spots nearby</h3>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {spotData.similarSpots.map((spot) => {
              const spotColor = getConfidenceColor(spot.confidence);
              return (
                <div
                  key={spot.id}
                  onClick={() => navigate(`/spot/${spot.id}`)}
                  className="flex-shrink-0 w-64 cursor-pointer"
                >
                  <GlassCard variant="light" className="!p-0 overflow-hidden hover:scale-[1.02] transition-transform">
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-[#4A4F55]">{spot.name}</p>
                          <p className="text-xs text-[#8A8D91] mt-0.5">{spot.distance}</p>
                        </div>
                        <div 
                          className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ 
                            backgroundColor: `${spotColor}20`,
                            color: spotColor
                          }}
                        >
                          {spot.confidence}%
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-3">
                        <Clock className="w-3.5 h-3.5 text-[#8A8D91]" />
                        <span className="text-xs text-[#8A8D91]">{spot.walkTime} walk</span>
                      </div>
                    </div>
                  </GlassCard>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report Issue Link */}
        <button className="w-full p-3 text-sm text-[#8A8D91] hover:text-[#7FA98E] transition-colors flex items-center justify-center gap-2">
          <Flag className="w-4 h-4" />
          Report an issue with this spot
        </button>
      </div>

      {/* Sticky Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F5F1E8] via-[#F5F1E8] to-transparent pointer-events-none">
        <div className="max-w-lg mx-auto pointer-events-auto">
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/navigate")}
              className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-bold text-lg flex items-center justify-center gap-2 shadow-lg hover:scale-[1.02] transition-transform"
            >
              <Navigation className="w-5 h-5" />
              Navigate
            </button>
            
            <button 
              onClick={() => setSaved(!saved)}
              className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center transition-all ${
                saved 
                  ? "bg-[#B87C7C]/20 border-[#B87C7C]" 
                  : "bg-white/95 border-[#D3D5D7]"
              }`}
            >
              <Heart 
                className={`w-6 h-6 transition-all ${saved ? "fill-[#B87C7C] text-[#B87C7C]" : "text-[#8A8D91]"}`} 
              />
            </button>
            
            <button className="w-16 h-16 rounded-2xl bg-white/95 border-2 border-[#D3D5D7] flex items-center justify-center hover:scale-105 transition-transform">
              <Share2 className="w-6 h-6 text-[#8A8D91]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}