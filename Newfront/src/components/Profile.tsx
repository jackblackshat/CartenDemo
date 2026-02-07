import { useState } from "react";
import { useNavigate } from "react-router";
import { User, Award, TrendingUp, Check, Settings, Bell, Bluetooth, Clock, ChevronRight, Moon, Sun } from "lucide-react";
import SubscriptionModal from "./SubscriptionModal";
import DurationModal from "./DurationModal";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function Profile() {
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useDarkMode();
  const [showSubscription, setShowSubscription] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [carPlayEnabled, setCarPlayEnabled] = useState(true);
  const [defaultDuration, setDefaultDuration] = useState("1 hour");

  return (
    <div className={`h-full overflow-y-auto pb-24 p-4 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[#8B9D83] to-[#7FA98E] p-6 pb-12 rounded-3xl shadow-lg mb-4">
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>
        
        {/* Avatar & Info */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-2 border-white/30">
            <User className="w-10 h-10 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Alex Chen</h2>
            <p className="text-white/80">alex.chen@email.com</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-6">
        <div className={`rounded-2xl p-4 border space-y-4 shadow-sm ${
          isDark 
            ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
            : 'bg-white border-[#D3D5D7]'
        }`}>
          {/* Trust Score */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center">
                <Award className="w-6 h-6 text-[#7FA98E]" />
              </div>
              <div>
                <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Trust Score</p>
                <p className={`text-2xl font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>87</p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Tier</p>
              <div className="px-3 py-1 rounded-full bg-gradient-to-r from-[#8B9D83] to-[#7FA98E]">
                <span className="text-sm font-bold text-white">Free</span>
              </div>
            </div>
          </div>

          <div className={`h-px ${isDark ? 'bg-[#3A3A3C]' : 'bg-[#D3D5D7]'}`} />

          {/* Credits */}
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Credits Balance</p>
              <p className="text-3xl font-bold text-[#7FA98E]">247</p>
            </div>
            <button className="px-4 py-2 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] text-[#5F7A61] text-sm font-semibold">
              Earn More
            </button>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mb-6">
        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Your Activity</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-xl p-4 border shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7]'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-[#7FA98E]" />
              <span className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Spots Shared</span>
            </div>
            <p className={`text-3xl font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>142</p>
          </div>
          
          <div className={`rounded-xl p-4 border shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7]'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              <Check className="w-4 h-4 text-[#7FA98E]" />
              <span className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Accuracy</span>
            </div>
            <p className="text-3xl font-bold text-[#7FA98E]">94%</p>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      <div className="mb-6">
        <button
          onClick={() => setShowSubscription(true)}
          className="w-full bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] rounded-2xl p-6 text-left shadow-md"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-bold text-white">Upgrade to Pro</h3>
            <ChevronRight className="w-6 h-6 text-white" />
          </div>
          <p className="text-sm text-white/90">
            Get real-time data, camera feeds, priority alerts & more
          </p>
        </button>
      </div>

      {/* Settings */}
      <div>
        <h3 className={`text-lg font-semibold mb-3 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Settings</h3>
        <div className={`rounded-2xl border divide-y shadow-sm ${
          isDark 
            ? 'bg-[#2C2C2E] border-[#3A3A3C] divide-[#3A3A3C]' 
            : 'bg-white border-[#D3D5D7] divide-[#D3D5D7]'
        }`}>
          {/* Dark Mode Toggle */}
          <button 
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              {isDark ? (
                <Sun className="w-5 h-5 text-[#AEAEB2]" />
              ) : (
                <Moon className="w-5 h-5 text-[#8A8D91]" />
              )}
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </span>
            </div>
            <div className={`w-12 h-6 rounded-full relative transition-colors ${
              isDark ? "bg-[#7FA98E]" : "bg-[#D3D5D7]"
            }`}>
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                isDark ? "right-1" : "left-1"
              }`} />
            </div>
          </button>

          <button 
            onClick={() => navigate("/notifications")}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Bell className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>Notifications</span>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
          </button>
          
          <button 
            onClick={() => setShowDurationModal(true)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Clock className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>Default Duration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{defaultDuration}</span>
              <ChevronRight className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
            </div>
          </button>
          
          <button 
            onClick={() => setCarPlayEnabled(!carPlayEnabled)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Bluetooth className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>CarPlay Connection</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-12 h-6 rounded-full relative transition-colors ${
                carPlayEnabled ? "bg-[#7FA98E]" : "bg-[#D3D5D7]"
              }`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  carPlayEnabled ? "right-1" : "left-1"
                }`} />
              </div>
            </div>
          </button>
          
          <button 
            onClick={() => navigate("/more-settings")}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center gap-3">
              <Settings className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>More Settings</span>
            </div>
            <ChevronRight className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
          </button>
        </div>
      </div>

      {/* Subscription Modal */}
      {showSubscription && (
        <SubscriptionModal onClose={() => setShowSubscription(false)} />
      )}

      {/* Duration Modal */}
      {showDurationModal && (
        <DurationModal 
          onClose={() => setShowDurationModal(false)}
          currentDuration={defaultDuration}
          onSelect={setDefaultDuration}
        />
      )}
    </div>
  );
}