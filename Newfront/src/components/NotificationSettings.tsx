import { ArrowLeft, Bell, MapPin, TrendingUp, AlertCircle, Camera, Users } from "lucide-react";
import { useNavigate } from "react-router";
import { useState } from "react";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function NotificationSettings() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [pushEnabled, setPushEnabled] = useState(true);
  const [spotAlerts, setSpotAlerts] = useState(true);
  const [parkingReminders, setParkingReminders] = useState(true);
  const [creditUpdates, setCreditUpdates] = useState(false);
  const [promoAlerts, setPromoAlerts] = useState(false);
  const [communityUpdates, setCommunityUpdates] = useState(true);

  const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
    <button
      onClick={onChange}
      className={`w-12 h-6 rounded-full relative transition-colors ${
        enabled ? "bg-[#7FA98E]" : isDark ? "bg-[#48484A]" : "bg-[#D3D5D7]"
      }`}
    >
      <div
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
          enabled ? "right-1" : "left-1"
        }`}
      />
    </button>
  );

  return (
    <div className={`h-full overflow-y-auto pb-24 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gradient-to-br from-[#8B9D83] to-[#7FA98E] px-4 py-6 shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"
          >
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
        </div>
        <p className="text-white/80 text-sm ml-13">Manage your alert preferences</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Master Toggle */}
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#2C2C2E] border-[#3A3A3C]' : 'bg-white border-[#D3D5D7]'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#7FA98E]" />
              </div>
              <div>
                <p className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Push Notifications</p>
                <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Enable all notifications</p>
              </div>
            </div>
            <ToggleSwitch enabled={pushEnabled} onChange={() => setPushEnabled(!pushEnabled)} />
          </div>
        </div>

        {/* Notification Categories */}
        <div className={`rounded-2xl border shadow-sm ${
          isDark 
            ? 'bg-[#2C2C2E] border-[#3A3A3C] divide-y divide-[#3A3A3C]' 
            : 'bg-white border-[#D3D5D7] divide-y divide-[#D3D5D7]'
        }`}>
          <div className="p-4">
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>PARKING ALERTS</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-[#7FA98E]" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Spot Availability</p>
                    <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>When spots open nearby</p>
                  </div>
                </div>
                <ToggleSwitch enabled={spotAlerts} onChange={() => setSpotAlerts(!spotAlerts)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-[#7FA98E]" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Parking Reminders</p>
                    <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Time limit & meter expiry</p>
                  </div>
                </div>
                <ToggleSwitch enabled={parkingReminders} onChange={() => setParkingReminders(!parkingReminders)} />
              </div>
            </div>
          </div>

          <div className="p-4">
            <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>ACCOUNT & UPDATES</h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-5 h-5 text-[#7FA98E]" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Credit Updates</p>
                    <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>When you earn or spend credits</p>
                  </div>
                </div>
                <ToggleSwitch enabled={creditUpdates} onChange={() => setCreditUpdates(!creditUpdates)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-[#7FA98E]" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Promotions & Offers</p>
                    <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Special deals and discounts</p>
                  </div>
                </div>
                <ToggleSwitch enabled={promoAlerts} onChange={() => setPromoAlerts(!promoAlerts)} />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-[#7FA98E]" />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Community Updates</p>
                    <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>New features & tips</p>
                  </div>
                </div>
                <ToggleSwitch enabled={communityUpdates} onChange={() => setCommunityUpdates(!communityUpdates)} />
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-[#7FA98E]/10 rounded-xl p-4 border border-[#7FA98E]">
          <p className="text-sm text-[#5F7A61]">
            💡 Tip: Keep spot availability alerts on to never miss a great parking spot!
          </p>
        </div>
      </div>
    </div>
  );
}