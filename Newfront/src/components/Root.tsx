import { Outlet, useLocation, useNavigate } from "react-router";
import { Map, Activity, User } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function Root() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useDarkMode();

  const navItems = [
    { icon: Map, label: "Map", path: "/" },
    { icon: Activity, label: "Activity", path: "/activity" },
    { icon: User, label: "Profile", path: "/profile" },
  ];

  return (
    <div className="flex flex-col h-screen">
      <div className="flex-1 overflow-hidden">
        <Outlet />
      </div>
      
      <nav className={`absolute bottom-4 left-4 right-4 flex items-center justify-around backdrop-blur-xl border rounded-3xl h-16 shadow-lg z-50 ${
        isDark 
          ? 'bg-[#2C2C2E]/95 border-[#3A3A3C]' 
          : 'bg-white/95 border-[#D3D5D7]'
      }`}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors"
            >
              <Icon
                className={`w-5 h-5 ${
                  isActive ? "text-[#7FA98E]" : (isDark ? "text-[#AEAEB2]" : "text-[#8A8D91]")
                }`}
              />
              <span
                className={`text-xs ${
                  isActive ? "text-[#7FA98E]" : (isDark ? "text-[#AEAEB2]" : "text-[#8A8D91]")
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}