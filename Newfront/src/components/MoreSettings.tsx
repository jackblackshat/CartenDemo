import { ArrowLeft, Shield, Globe, HelpCircle, FileText, LogOut, Trash2, Share2, Moon, Smartphone } from "lucide-react";
import { useNavigate } from "react-router";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function MoreSettings() {
  const navigate = useNavigate();
  const { isDark, toggleDarkMode } = useDarkMode();

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
          <h1 className="text-2xl font-bold text-white">More Settings</h1>
        </div>
        <p className="text-white/80 text-sm ml-13">App preferences and account management</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Appearance */}
        <div>
          <h3 className={`text-sm font-semibold mb-2 px-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>APPEARANCE</h3>
          <div className={`rounded-2xl border shadow-sm ${
            isDark ? 'bg-[#2C2C2E] border-[#3A3A3C]' : 'bg-white border-[#D3D5D7]'
          }`}>
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Dark Mode</p>
                  <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{isDark ? 'Enabled' : 'Disabled'}</p>
                </div>
              </div>
              <ToggleSwitch enabled={isDark} onChange={toggleDarkMode} />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className={`text-sm font-semibold mb-2 px-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>PREFERENCES</h3>
          <div className={`rounded-2xl border shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C] divide-y divide-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7] divide-y divide-[#D3D5D7]'
          }`}>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Globe className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Language</p>
                  <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>English (US)</p>
                </div>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>

            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Smartphone className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Map Style</p>
                  <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Standard</p>
                </div>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>
          </div>
        </div>

        {/* Privacy & Security */}
        <div>
          <h3 className={`text-sm font-semibold mb-2 px-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>PRIVACY & SECURITY</h3>
          <div className={`rounded-2xl border shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C] divide-y divide-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7] divide-y divide-[#D3D5D7]'
          }`}>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Shield className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Privacy Policy</span>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>

            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <FileText className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Terms of Service</span>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>
          </div>
        </div>

        {/* Support */}
        <div>
          <h3 className={`text-sm font-semibold mb-2 px-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>SUPPORT</h3>
          <div className={`rounded-2xl border shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C] divide-y divide-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7] divide-y divide-[#D3D5D7]'
          }`}>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <HelpCircle className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Help & Support</span>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>

            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Share2 className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                <span className={`text-sm font-medium ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Share App</span>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>
          </div>
        </div>

        {/* Account Actions */}
        <div>
          <h3 className={`text-sm font-semibold mb-2 px-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>ACCOUNT</h3>
          <div className={`rounded-2xl border shadow-sm ${
            isDark 
              ? 'bg-[#2C2C2E] border-[#3A3A3C] divide-y divide-[#3A3A3C]' 
              : 'bg-white border-[#D3D5D7] divide-y divide-[#D3D5D7]'
          }`}>
            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <LogOut className="w-5 h-5 text-[#C9A96E]" />
                <span className="text-sm font-medium text-[#C9A96E]">Sign Out</span>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>

            <button className="w-full p-4 flex items-center justify-between text-left">
              <div className="flex items-center gap-3">
                <Trash2 className="w-5 h-5 text-[#B87C7C]" />
                <span className="text-sm font-medium text-[#B87C7C]">Delete Account</span>
              </div>
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>›</span>
            </button>
          </div>
        </div>

        {/* App Version */}
        <div className="text-center py-4">
          <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Version 1.2.4</p>
          <p className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>© 2026 Carten</p>
        </div>
      </div>
    </div>
  );
}