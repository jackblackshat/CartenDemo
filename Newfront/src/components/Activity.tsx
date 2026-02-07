import { Clock, MapPin, TrendingUp, Award } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";

const activityItems = [
  {
    id: 1,
    type: "shared",
    location: "Market Street",
    time: "2 hours ago",
    credits: 10,
    icon: MapPin,
    color: "#7FA98E",
  },
  {
    id: 2,
    type: "found",
    location: "Valencia Street",
    time: "5 hours ago",
    icon: TrendingUp,
    color: "#8B9D83",
  },
  {
    id: 3,
    type: "shared",
    location: "Mission St Garage",
    time: "1 day ago",
    credits: 15,
    icon: MapPin,
    color: "#7FA98E",
  },
  {
    id: 4,
    type: "achievement",
    title: "Trust Builder",
    description: "Shared 100 spots",
    time: "2 days ago",
    icon: Award,
    color: "#C9A96E",
  },
  {
    id: 5,
    type: "found",
    location: "Howard Street",
    time: "3 days ago",
    icon: TrendingUp,
    color: "#8B9D83",
  },
];

export default function Activity() {
  const { isDark } = useDarkMode();

  return (
    <div className={`h-full overflow-y-auto pb-24 p-4 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      {/* Header */}
      <div className={`backdrop-blur-xl border px-4 py-4 shadow-md rounded-3xl mb-4 ${
        isDark 
          ? 'bg-[#2C2C2E]/90 border-[#3A3A3C]' 
          : 'bg-white/90 border-[#D3D5D7]'
      }`}>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Activity</h1>
      </div>

      {/* Stats Summary */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className={`rounded-xl p-4 border text-center shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7]'
          }`}>
            <p className="text-2xl font-bold text-[#7FA98E]">142</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Spots Shared</p>
          </div>
          <div className={`rounded-xl p-4 border text-center shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7]'
          }`}>
            <p className="text-2xl font-bold text-[#8B9D83]">89</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Spots Found</p>
          </div>
          <div className={`rounded-xl p-4 border text-center shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7]'
          }`}>
            <p className="text-2xl font-bold text-[#C9A96E]">247</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Credits</p>
          </div>
        </div>

        {/* Activity Feed */}
        <h2 className={`text-lg font-semibold mb-3 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Recent Activity</h2>
        <div className="space-y-3">
          {activityItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                className={`rounded-xl p-4 border shadow-sm ${
                  isDark 
                    ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
                    : 'bg-white border-[#D3D5D7]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${item.color}20`,
                      border: `1px solid ${item.color}`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  
                  <div className="flex-1">
                    {item.type === "shared" && (
                      <>
                        <p className={`font-semibold mb-1 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Shared a parking spot</p>
                        <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{item.location}</p>
                      </>
                    )}
                    {item.type === "found" && (
                      <>
                        <p className={`font-semibold mb-1 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Found parking</p>
                        <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{item.location}</p>
                      </>
                    )}
                    {item.type === "achievement" && (
                      <>
                        <p className={`font-semibold mb-1 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{item.title}</p>
                        <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{item.description}</p>
                      </>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className={`w-3 h-3 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                      <span className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{item.time}</span>
                    </div>
                  </div>

                  {item.credits && (
                    <div className="px-3 py-1 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E]">
                      <span className="text-sm font-semibold text-[#5F7A61]">
                        +{item.credits}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}