import { useNavigate, useParams } from "react-router";
import { ArrowLeft, MapPin, DollarSign, Car, Zap, Shield, Wifi, Camera, Navigation } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";

export default function GaragePaid() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDark } = useDarkMode();

  return (
    <div className={`h-full flex flex-col overflow-y-auto pb-24 ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b px-4 py-3 shadow-sm ${
        isDark 
          ? 'bg-[#2C2C2E]/90 border-[#3A3A3C]' 
          : 'bg-white/90 border-[#D3D5D7]'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className={`w-9 h-9 rounded-full flex items-center justify-center border ${
              isDark 
                ? 'bg-[#3A3A3C] border-[#48484A]' 
                : 'bg-[#F5F1E8] border-[#D3D5D7]'
            }`}
          >
            <ArrowLeft className={`w-5 h-5 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`} />
          </button>
          <h1 className={`text-lg font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Garage Details</h1>
        </div>
      </div>

      {/* Hero Section */}
      <div className={`relative h-48 border-b flex items-center justify-center ${
        isDark 
          ? 'bg-gradient-to-br from-[#7FA98E]/10 to-[#7FA98E]/5 border-[#3A3A3C]' 
          : 'bg-gradient-to-br from-[#8B9D83]/20 to-[#7FA98E]/20 border-[#D3D5D7]'
      }`}>
        <Car className="w-24 h-24 text-[#7FA98E]" />
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Header Info */}
        <div>
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className={`text-2xl font-bold mb-1 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Mission Street Garage</h2>
              <div className={`flex items-center gap-2 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                <MapPin className="w-4 h-4" />
                <span className="text-sm">525 Mission St, San Francisco</span>
              </div>
            </div>
            <div className="px-3 py-1 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E]">
              <span className="text-sm font-semibold text-[#5F7A61]">Partner</span>
            </div>
          </div>
        </div>

        {/* Real-time Availability */}
        <div className="bg-gradient-to-r from-[#7FA98E]/20 to-[#7FA98E]/10 rounded-2xl p-6 border border-[#7FA98E] shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Real-time Availability</span>
            <div className="w-2 h-2 rounded-full bg-[#7FA98E] animate-pulse" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-5xl font-bold text-[#7FA98E]">47</span>
            <span className={`text-2xl ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>/ 200</span>
          </div>
          <p className={`text-sm mt-1 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>spots available now</p>
        </div>

        {/* Pricing Table */}
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#2C2C2E] border-[#3A3A3C]' : 'bg-white border-[#D3D5D7]'
        }`}>
          <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
            <DollarSign className="w-5 h-5 text-[#7FA98E]" />
            Pricing
          </h3>
          <div className="space-y-3">
            <div className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-[#3A3A3C]' : 'border-[#D3D5D7]'}`}>
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>Hourly Rate</span>
              <span className="font-semibold text-[#7FA98E]">$4.00</span>
            </div>
            <div className={`flex items-center justify-between py-2 border-b ${isDark ? 'border-[#3A3A3C]' : 'border-[#D3D5D7]'}`}>
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>Daily Maximum</span>
              <span className="font-semibold text-[#7FA98E]">$28.00</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>Weekend Special</span>
              <span className="font-semibold text-[#8B9D83]">$3.00/hr</span>
            </div>
          </div>

          {/* Partner Discount */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-[#7FA98E]/10 to-[#8B9D83]/10 border border-[#7FA98E]">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#7FA98E]" />
              <span className="text-sm font-semibold text-[#7FA98E]">Pro Member Discount: 10% off</span>
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#2C2C2E] border-[#3A3A3C]' : 'bg-white border-[#D3D5D7]'
        }`}>
          <h3 className={`font-semibold mb-4 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Amenities</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#7FA98E]" />
              </div>
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>24/7 Security</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[#7FA98E]" />
              </div>
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>CCTV</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center">
                <Zap className="w-5 h-5 text-[#7FA98E]" />
              </div>
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>EV Charging</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E] flex items-center justify-center">
                <Wifi className="w-5 h-5 text-[#7FA98E]" />
              </div>
              <span className={`text-sm ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>WiFi</span>
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className={`rounded-2xl p-4 border shadow-sm ${
          isDark ? 'bg-[#2C2C2E] border-[#3A3A3C]' : 'bg-white border-[#D3D5D7]'
        }`}>
          <h3 className={`font-semibold mb-3 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Hours</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>Monday - Friday</span>
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>24 hours</span>
            </div>
            <div className="flex justify-between">
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>Weekend</span>
              <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>24 hours</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/navigate")}
            className="flex-1 py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-semibold flex items-center justify-center gap-2 shadow-md"
          >
            <Navigation className="w-5 h-5" />
            Navigate
          </button>
          <button className={`flex-1 py-4 rounded-2xl border-2 border-[#7FA98E] text-[#7FA98E] font-semibold shadow-sm ${
            isDark ? 'bg-transparent' : 'bg-white'
          }`}>
            Reserve Now
          </button>
        </div>
      </div>
    </div>
  );
}