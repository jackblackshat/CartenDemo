import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { X, MapPin, Clock, TrendingUp, Circle, Navigation as NavigationIcon, Loader2, AlertCircle } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";
import { useUserLocation } from "../hooks/useUserLocation";
import { useRouting } from "../hooks/useRouting";

interface Destination {
  name: string;
  lat: number;
  lng: number;
}

export default function Navigation() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [isNavigating, setIsNavigating] = useState(false);
  const [destination, setDestination] = useState<Destination | null>(null);

  // Get user location
  const { location: userLocation, loading: locationLoading, error: locationError } = useUserLocation(true);

  // Get routing data
  const { route, loading: routeLoading, error: routeError } = useRouting(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : null,
    destination ? { lat: destination.lat, lng: destination.lng } : null
  );

  // Load destination from sessionStorage
  useEffect(() => {
    const stored = sessionStorage.getItem('selectedDestination');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setDestination(parsed);
      } catch {
        // Use fallback destination
        setDestination({
          name: "Market St Parking",
          lat: 37.7899,
          lng: -122.4025,
        });
      }
    } else {
      // Fallback destination
      setDestination({
        name: "Market St Parking",
        lat: 37.7899,
        lng: -122.4025,
      });
    }
  }, []);

  // Calculate route stats
  const durationMins = route ? Math.round(route.duration / 60) : 8;
  const distanceMiles = route ? (route.distance / 1609.34).toFixed(1) : "1.2";
  const confidence = 94; // This would come from parking API
  const arrivalTime = new Date(Date.now() + (durationMins * 60 * 1000)).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

  const isLoading = locationLoading || routeLoading;
  const hasError = locationError || routeError;

  // Route Preview - Before Starting Navigation
  if (!isNavigating) {
    return (
      <div className={`h-full flex flex-col ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
        {/* Apple Maps Embed Area - Route Preview */}
        <div className={`flex-1 relative ${isDark ? 'bg-gradient-to-b from-[#2C2C2E] to-[#1C1C1E]' : 'bg-gradient-to-b from-[#E8EDE8] to-[#F0EDE5]'}`}>
          {/* Simulated Route Line */}
          {userLocation && destination && (
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path
                d="M 30 70 Q 50 50 70 30"
                stroke="#7FA98E"
                strokeWidth="0.5"
                fill="none"
                strokeDasharray="2,1"
              />
              {/* Origin marker */}
              <circle cx="30" cy="70" r="2" fill="#4285f4" />
              {/* Destination marker */}
              <circle cx="70" cy="30" r="2" fill="#7FA98E" />
            </svg>
          )}

          {/* Loading/Error overlay */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-sm">
              <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-[#2C2C2E]' : 'bg-white'}`}>
                <Loader2 className="w-5 h-5 animate-spin text-[#7FA98E]" />
                <span className={isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}>Calculating route...</span>
              </div>
            </div>
          )}

          {hasError && !isLoading && (
            <div className="absolute top-16 left-4 right-4">
              <div className={`px-4 py-3 rounded-2xl flex items-center gap-3 ${isDark ? 'bg-[#B87C7C]/20' : 'bg-[#B87C7C]/10'}`}>
                <AlertCircle className="w-5 h-5 text-[#B87C7C]" />
                <span className="text-sm text-[#B87C7C]">Using estimated route data</span>
              </div>
            </div>
          )}

          {/* Close Button - Liquid Glass */}
          <div className="absolute top-12 left-4">
            <button
              onClick={() => navigate(-1)}
              className={`w-11 h-11 backdrop-blur-2xl rounded-full flex items-center justify-center shadow-lg border hover:bg-opacity-90 transition-all ${isDark
                  ? 'bg-[#3A3A3C]/70 border-[#48484A]/40'
                  : 'bg-white/70 border-white/40'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 8px 32px rgba(127, 169, 142, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.5)',
              }}
            >
              <X className={`w-5 h-5 ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`} strokeWidth={2.5} />
            </button>
          </div>
        </div>

        {/* Bottom Sheet - Liquid Glass */}
        <div
          className={`backdrop-blur-3xl rounded-t-[32px] shadow-2xl border-t ${isDark
              ? 'bg-[#2C2C2E]/80 border-[#3A3A3C]/60'
              : 'bg-white/80 border-white/60'
            }`}
          style={{
            boxShadow: isDark
              ? '0 -8px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
              : '0 -8px 64px rgba(127, 169, 142, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
          }}
        >
          {/* Drag Handle */}
          <div className="pt-3 pb-5 flex justify-center">
            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-[#48484A]/60' : 'bg-[#D3D5D7]/60'}`} />
          </div>

          <div className="px-6 pb-8">
            {/* Destination - Liquid Glass Pill */}
            <div
              className={`flex items-center gap-3 mb-6 p-4 rounded-3xl backdrop-blur-xl border ${isDark
                  ? 'bg-gradient-to-br from-[#3A3A3C]/60 to-[#2C2C2E]/40 border-[#48484A]/60'
                  : 'bg-gradient-to-br from-white/60 to-white/40 border-white/60'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 4px 24px rgba(127, 169, 142, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              <div
                className="w-14 h-14 rounded-full bg-gradient-to-br from-[#8FB89D] to-[#7FA98E] flex items-center justify-center shadow-lg"
                style={{
                  boxShadow: '0 4px 16px rgba(127, 169, 142, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
                }}
              >
                <MapPin className="w-7 h-7 text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className={`text-xl font-bold tracking-tight truncate ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
                  {destination?.name || 'Loading...'}
                </h2>
                <p className={`text-sm font-medium ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                  {userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Getting location...'}
                </p>
              </div>
            </div>

            {/* Route Stats - Liquid Glass Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div
                className={`backdrop-blur-xl rounded-3xl p-5 text-center border ${isDark
                    ? 'bg-gradient-to-br from-[#3A3A3C]/80 to-[#2C2C2E]/60 border-[#48484A]/50'
                    : 'bg-gradient-to-br from-[#F8F9F6]/80 to-[#F5F1E8]/60 border-white/50'
                  }`}
                style={{
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    : '0 4px 20px rgba(127, 169, 142, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <p className="text-3xl font-bold text-[#7FA98E] tracking-tight">{durationMins}</p>
                <p className={`text-xs mt-1.5 font-semibold uppercase tracking-wider ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>min</p>
              </div>
              <div
                className={`backdrop-blur-xl rounded-3xl p-5 text-center border ${isDark
                    ? 'bg-gradient-to-br from-[#3A3A3C]/80 to-[#2C2C2E]/60 border-[#48484A]/50'
                    : 'bg-gradient-to-br from-[#F8F9F6]/80 to-[#F5F1E8]/60 border-white/50'
                  }`}
                style={{
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    : '0 4px 20px rgba(127, 169, 142, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <p className={`text-3xl font-bold tracking-tight ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{distanceMiles}</p>
                <p className={`text-xs mt-1.5 font-semibold uppercase tracking-wider ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>miles</p>
              </div>
              <div
                className={`backdrop-blur-xl rounded-3xl p-5 text-center border ${isDark
                    ? 'bg-gradient-to-br from-[#3A3A3C]/80 to-[#2C2C2E]/60 border-[#48484A]/50'
                    : 'bg-gradient-to-br from-[#F8F9F6]/80 to-[#F5F1E8]/60 border-white/50'
                  }`}
                style={{
                  boxShadow: isDark
                    ? '0 4px 20px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                    : '0 4px 20px rgba(127, 169, 142, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
                }}
              >
                <p className="text-3xl font-bold text-[#7FA98E] tracking-tight">{confidence}%</p>
                <p className={`text-xs mt-1.5 font-semibold uppercase tracking-wider ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>confident</p>
              </div>
            </div>

            {/* Route Info - Liquid Glass Container */}
            <div
              className={`space-y-4 mb-6 p-5 rounded-3xl backdrop-blur-xl border ${isDark
                  ? 'bg-gradient-to-br from-[#3A3A3C]/50 to-[#2C2C2E]/30 border-[#48484A]/50'
                  : 'bg-gradient-to-br from-white/50 to-white/30 border-white/50'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 4px 24px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  : '0 4px 24px rgba(127, 169, 142, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full backdrop-blur-xl flex items-center justify-center border ${isDark ? 'bg-[#3A3A3C]/60 border-[#48484A]/60' : 'bg-white/60 border-white/60'
                    }`}>
                    <Clock className="w-4 h-4 text-[#7FA98E]" strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Estimated arrival</span>
                </div>
                <span className={`text-sm font-bold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{arrivalTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full backdrop-blur-xl flex items-center justify-center border ${isDark ? 'bg-[#3A3A3C]/60 border-[#48484A]/60' : 'bg-white/60 border-white/60'
                    }`}>
                    <TrendingUp className="w-4 h-4 text-[#7FA98E]" strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Traffic</span>
                </div>
                <span className="text-sm font-bold text-[#7FA98E]">Light</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-full backdrop-blur-xl flex items-center justify-center border ${isDark ? 'bg-[#3A3A3C]/60 border-[#48484A]/60' : 'bg-white/60 border-white/60'
                    }`}>
                    <Circle className="w-4 h-4 text-[#7FA98E]" strokeWidth={2.5} />
                  </div>
                  <span className={`text-sm font-medium ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Spot availability</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4].map((i) => (
                    <Circle
                      key={i}
                      className="w-2.5 h-2.5 fill-[#7FA98E] text-[#7FA98E]"
                      style={{
                        filter: 'drop-shadow(0 1px 2px rgba(127, 169, 142, 0.4))',
                      }}
                    />
                  ))}
                  <Circle className={`w-2.5 h-2.5 ${isDark ? 'text-[#48484A]' : 'text-[#D3D5D7]'}`} />
                </div>
              </div>
            </div>

            {/* Start Navigation Button - Liquid Glass */}
            <button
              onClick={() => setIsNavigating(true)}
              disabled={isLoading}
              className="w-full py-5 bg-gradient-to-br from-[#8FB89D] via-[#7FA98E] to-[#729E85] text-white font-bold text-lg rounded-[28px] shadow-lg flex items-center justify-center gap-3 border border-[#8FB89D]/30 hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50"
              style={{
                boxShadow: '0 8px 32px rgba(127, 169, 142, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0 rgba(0, 0, 0, 0.1)',
              }}
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <NavigationIcon className="w-6 h-6" strokeWidth={2.5} />
              )}
              {isLoading ? 'Loading...' : 'Start Navigation'}
            </button>

            {/* Alternative Options - Liquid Glass */}
            <button
              onClick={() => navigate('/search')}
              className={`w-full py-4 backdrop-blur-xl font-bold text-sm rounded-[24px] mt-4 border transition-all ${isDark
                  ? 'bg-[#3A3A3C]/50 text-[#7FA98E] border-[#48484A]/60 hover:bg-[#3A3A3C]/60'
                  : 'bg-white/50 text-[#7FA98E] border-white/60 hover:bg-white/60'
                }`}
              style={{
                boxShadow: isDark
                  ? '0 4px 16px rgba(0, 0, 0, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
                  : '0 4px 16px rgba(127, 169, 142, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
              }}
            >
              Find Alternative Spot
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Navigation - After Starting
  return (
    <div className={`h-full flex flex-col relative ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      {/* Apple Maps Embed Area - Active Navigation */}
      <div className={`flex-1 relative ${isDark ? 'bg-gradient-to-b from-[#2C2C2E] to-[#1C1C1E]' : 'bg-gradient-to-b from-[#E8EDE8] to-[#F0EDE5]'}`}>
        {/* Simulated active route */}
        {userLocation && destination && (
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path
              d="M 30 70 Q 50 50 70 30"
              stroke="#7FA98E"
              strokeWidth="1"
              fill="none"
            />
            {/* Current position marker (animated) */}
            <circle cx="40" cy="60" r="3" fill="#4285f4">
              <animate attributeName="r" values="3;4;3" dur="1.5s" repeatCount="indefinite" />
            </circle>
            {/* Destination marker */}
            <circle cx="70" cy="30" r="2" fill="#7FA98E" />
          </svg>
        )}

        {/* End Button - Top Left - Liquid Glass */}
        <div className="absolute top-12 left-4">
          <button
            onClick={() => navigate(-1)}
            className={`px-6 py-3 backdrop-blur-2xl rounded-full font-bold text-sm shadow-lg border transition-all ${isDark
                ? 'bg-[#3A3A3C]/70 text-[#F5F5F7] border-[#48484A]/50 hover:bg-[#3A3A3C]/80'
                : 'bg-white/70 text-[#4A4F55] border-white/50 hover:bg-white/80'
              }`}
            style={{
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(127, 169, 142, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            }}
          >
            End
          </button>
        </div>

        {/* Spot Confidence Indicator - Top Right - Liquid Glass */}
        <div className="absolute top-12 right-4">
          <div
            className={`backdrop-blur-2xl rounded-[20px] px-4 py-3 shadow-lg border ${isDark
                ? 'bg-[#3A3A3C]/70 border-[#48484A]/50'
                : 'bg-white/70 border-white/50'
              }`}
            style={{
              boxShadow: isDark
                ? '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                : '0 8px 32px rgba(127, 169, 142, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6)',
            }}
          >
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((i) => (
                  <Circle
                    key={i}
                    className="w-2.5 h-2.5 fill-[#7FA98E] text-[#7FA98E]"
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(127, 169, 142, 0.4))',
                    }}
                  />
                ))}
                <Circle className={`w-2.5 h-2.5 ${isDark ? 'text-[#48484A]' : 'text-[#D3D5D7]'}`} />
              </div>
              <span className="text-sm font-bold text-[#7FA98E]">{confidence}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ETA Bar - Liquid Glass */}
      <div
        className={`backdrop-blur-3xl border-t shadow-2xl ${isDark
            ? 'bg-[#2C2C2E]/80 border-[#3A3A3C]/60'
            : 'bg-white/80 border-white/60'
          }`}
        style={{
          boxShadow: isDark
            ? '0 -8px 64px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
            : '0 -8px 64px rgba(127, 169, 142, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8)',
        }}
      >
        <div className="px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8FB89D] to-[#7FA98E] flex items-center justify-center shadow-lg"
              style={{
                boxShadow: '0 4px 16px rgba(127, 169, 142, 0.35), inset 0 2px 4px rgba(255, 255, 255, 0.3)',
              }}
            >
              <MapPin className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <div className="text-left">
              <p className={`text-sm font-bold truncate max-w-[150px] ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
                {destination?.name || 'Destination'}
              </p>
              <p className={`text-xs font-medium ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{distanceMiles} mi • Light traffic</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-[#7FA98E] tracking-tight leading-none">{durationMins}</p>
            <p className={`text-sm font-semibold ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>min</p>
          </div>
        </div>
      </div>
    </div>
  );
}
