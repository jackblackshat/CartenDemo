import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Search, MapPin, Layers, LogOut, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import SpotCard from "./SpotCard";
import LeavingModal from "./LeavingModal";
import Map from "./Map";
import { useDarkMode } from "../context/DarkModeContext.tsx";
import { useUserLocation } from "../hooks/useUserLocation";
import { fetchParkingWithFallback, fetchCrowdsourceSpots } from "../services/api";
import type { ParkingSpot, CrowdsourceSpot } from "../types";

// Fallback mock spots for when API is unavailable
const fallbackSpots: ParkingSpot[] = [
  {
    id: "1",
    street: "Market Street",
    distance: "0.2 mi",
    confidence: 94,
    type: "street",
    status: "available",
    timeValid: "~5 mins",
    timeLimit: "2hr max",
    sources: ["camera", "crowd"],
    lat: 37.7899,
    lng: -122.4025,
  },
  {
    id: "2",
    street: "Valencia Street",
    distance: "0.4 mi",
    confidence: 87,
    type: "street",
    status: "prediction",
    timeValid: "~8 mins",
    timeLimit: "3hr max",
    sources: ["prediction", "api"],
    lat: 37.7889,
    lng: -122.4035,
  },
  {
    id: "3",
    street: "Mission Street Garage",
    distance: "0.6 mi",
    confidence: 99,
    type: "garage",
    status: "paid",
    timeValid: "Real-time",
    price: "$4/hr",
    sources: ["api"],
    lat: 37.7879,
    lng: -122.4045,
  },
];

export default function MapHome() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [sheetHeight, setSheetHeight] = useState(320);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [filters, setFilters] = useState<string[]>(["Free", "Paid", "Garage", "Street"]);
  const [showParkedModal, setShowParkedModal] = useState(false);
  const [showLeavingModal, setShowLeavingModal] = useState(false);

  // API state
  const [spots, setSpots] = useState<ParkingSpot[]>([]);
  const [crowdsourceSpots, setCrowdsourceSpots] = useState<CrowdsourceSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user location
  const { location, loading: locationLoading, error: locationError } = useUserLocation();

  // Fetch parking data when location is available
  useEffect(() => {
    async function fetchData() {
      if (!location) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch parking from INRIX API
        const parkingResult = await fetchParkingWithFallback(location);

        if (parkingResult) {
          const apiSpot: ParkingSpot = {
            id: parkingResult.blockId,
            street: parkingResult.name,
            distance: `${(parkingResult.distance / 1609.34).toFixed(1)} mi`,
            confidence: Math.round(parkingResult.probability * 100),
            type: "street",
            status: parkingResult.probability > 0.7 ? "available" : "prediction",
            timeValid: `~${Math.round(parkingResult.exp / 60)} mins`,
            timeLimit: "2hr max",
            sources: ["api"],
            lat: location.lat,
            lng: location.lng,
          };
          setSpots([apiSpot, ...fallbackSpots.slice(1)]);
        } else {
          // Use fallback spots if no API data
          setSpots(fallbackSpots);
        }

        // Also fetch crowdsource spots
        try {
          const crowdsourceResult = await fetchCrowdsourceSpots(location.lat, location.lng, 500);
          setCrowdsourceSpots(crowdsourceResult.spots || []);
        } catch {
          // Silently fail for crowdsource spots
        }
      } catch (err) {
        console.error("Error fetching parking:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch parking data");
        setSpots(fallbackSpots);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [location?.lat, location?.lng]);

  // Use fallback if location fails
  useEffect(() => {
    if (locationError && spots.length === 0) {
      setSpots(fallbackSpots);
      setLoading(false);
    }
  }, [locationError, spots.length]);

  const toggleFilter = (filter: string) => {
    setFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  // Filter spots based on selected filters
  const filteredSpots = spots.filter(spot => {
    if (filters.includes("Free") && spot.status === "available" && !spot.price) return true;
    if (filters.includes("Paid") && (spot.status === "paid" || spot.price)) return true;
    if (filters.includes("Garage") && spot.type === "garage") return true;
    if (filters.includes("Street") && spot.type === "street") return true;
    return false;
  });

  const handleDragEnd = (finalHeight: number) => {
    const windowHeight = window.innerHeight;
    const collapsed = 320;
    const expanded = windowHeight - 100;
    const mid = 500;

    if (finalHeight < (collapsed + mid) / 2) {
      setSheetHeight(collapsed);
    } else if (finalHeight < (mid + expanded) / 2) {
      setSheetHeight(mid);
    } else {
      setSheetHeight(expanded);
    }
  };

  const handleRefresh = () => {
    if (location) {
      setLoading(true);
      fetchParkingWithFallback(location)
        .then(result => {
          if (result) {
            const apiSpot: ParkingSpot = {
              id: result.blockId,
              street: result.name,
              distance: `${(result.distance / 1609.34).toFixed(1)} mi`,
              confidence: Math.round(result.probability * 100),
              type: "street",
              status: result.probability > 0.7 ? "available" : "prediction",
              timeValid: `~${Math.round(result.exp / 60)} mins`,
              timeLimit: "2hr max",
              sources: ["api"],
              lat: location.lat,
              lng: location.lng,
            };
            setSpots([apiSpot, ...fallbackSpots.slice(1)]);
          }
        })
        .catch(() => {
          setError("Failed to refresh");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const handleSpotClick = (spotId: string) => {
    navigate(`/spot/${spotId}`);
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      {/* Real Mapbox Map */}
      <Map
        spots={filteredSpots}
        userLocation={location}
        onSpotClick={handleSpotClick}
        showHeatmap={showHeatmap}
      />

      {/* Top Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
        {/* Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={loading}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${isDark
              ? 'bg-[#2C2C2E]/95 backdrop-blur-xl text-[#AEAEB2] border border-[#3A3A3C]'
              : 'bg-white/95 backdrop-blur-xl text-[#8A8D91] border border-[#D3D5D7]'
            }`}
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Heatmap Toggle */}
        <button
          onClick={() => setShowHeatmap(!showHeatmap)}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-sm ${showHeatmap
              ? 'bg-[#7FA98E] text-white'
              : isDark
                ? 'bg-[#2C2C2E]/95 backdrop-blur-xl text-[#AEAEB2] border border-[#3A3A3C]'
                : 'bg-white/95 backdrop-blur-xl text-[#8A8D91] border border-[#D3D5D7]'
            }`}
        >
          <Layers className="w-5 h-5" />
        </button>

        {/* Heatmap Legend */}
        {showHeatmap && (
          <div className={`mt-3 backdrop-blur-xl rounded-2xl p-3 border shadow-md ${isDark
              ? 'bg-[#2C2C2E]/95 border-[#3A3A3C]'
              : 'bg-white/95 border-[#D3D5D7]'
            }`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Availability Heatmap</span>
              <span className="text-xs text-[#7FA98E]">Based on prediction</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 rounded-full bg-gradient-to-r from-[#B87C7C] via-[#C9A96E] to-[#7FA98E]" />
              <span className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Low → High</span>
            </div>
          </div>
        )}
      </div>

      {/* Location Status Indicator */}
      {locationLoading && (
        <div className="absolute top-4 left-4 z-10">
          <div className={`px-3 py-2 rounded-full flex items-center gap-2 ${isDark
              ? 'bg-[#2C2C2E]/95 backdrop-blur-xl border border-[#3A3A3C]'
              : 'bg-white/95 backdrop-blur-xl border border-[#D3D5D7]'
            }`}>
            <Loader2 className="w-4 h-4 animate-spin text-[#7FA98E]" />
            <span className={`text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Getting location...</span>
          </div>
        </div>
      )}

      {/* Floating I'm Parked Button */}
      <button
        onClick={() => setShowParkedModal(true)}
        className="absolute bottom-[420px] right-4 z-20 w-14 h-14 bg-[#7FA98E] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <MapPin className="w-6 h-6 text-white" />
      </button>

      {/* Floating I'm Leaving Button */}
      <button
        onClick={() => setShowLeavingModal(true)}
        className="absolute bottom-[490px] right-4 z-20 w-14 h-14 bg-[#B87C7C] rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
      >
        <LogOut className="w-6 h-6 text-white" />
      </button>

      {/* Bottom Sheet */}
      <div
        className={`absolute left-4 right-4 rounded-3xl shadow-2xl z-10 transition-all duration-300 ease-out overflow-hidden ${isDark ? 'bg-[#2C2C2E]' : 'bg-white'
          }`}
        style={{
          height: `${sheetHeight}px`,
          bottom: '96px'
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
          onMouseDown={(e) => {
            const startY = e.clientY;
            const startHeight = sheetHeight;
            const handleMove = (e: MouseEvent) => {
              const deltaY = startY - e.clientY;
              const newHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight + deltaY));
              setSheetHeight(newHeight);
            };
            const handleEnd = (e: MouseEvent) => {
              const deltaY = startY - e.clientY;
              const finalHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight + deltaY));
              handleDragEnd(finalHeight);
              document.removeEventListener('mousemove', handleMove);
              document.removeEventListener('mouseup', handleEnd);
            };
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleEnd);
          }}
          onTouchStart={(e) => {
            const startY = e.touches[0].clientY;
            const startHeight = sheetHeight;
            const handleMove = (e: TouchEvent) => {
              const deltaY = startY - e.touches[0].clientY;
              const newHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight + deltaY));
              setSheetHeight(newHeight);
            };
            const handleEnd = (e: TouchEvent) => {
              const deltaY = startY - (e.changedTouches[0]?.clientY || startY);
              const finalHeight = Math.max(200, Math.min(window.innerHeight - 100, startHeight + deltaY));
              handleDragEnd(finalHeight);
              document.removeEventListener('touchmove', handleMove);
              document.removeEventListener('touchend', handleEnd);
            };
            document.addEventListener('touchmove', handleMove);
            document.addEventListener('touchend', handleEnd);
          }}
        >
          <div className={`w-12 h-1 rounded-full ${isDark ? 'bg-[#48484A]' : 'bg-[#D3D5D7]'}`} />
        </div>

        <div className="px-4 pb-4 overflow-y-auto" style={{ height: `${sheetHeight - 40}px` }}>
          {/* Search Bar */}
          <div className="mb-4">
            <button
              onClick={() => navigate('/search')}
              className={`w-full h-12 backdrop-blur-xl rounded-3xl px-4 flex items-center gap-3 border hover:border-[#7FA98E] transition-colors shadow-sm ${isDark
                  ? 'bg-[#3A3A3C]/95 border-[#48484A]'
                  : 'bg-[#F5F1E8]/95 border-[#D3D5D7]'
                }`}
            >
              <Search className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
              <span className={isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}>Where are you going?</span>
            </button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Finding spots...
                </span>
              ) : error ? (
                <span className="flex items-center gap-2 text-[#B87C7C]">
                  <AlertCircle className="w-5 h-5" />
                  {filteredSpots.length} spots (cached)
                </span>
              ) : (
                `${filteredSpots.length} spots nearby`
              )}
            </h2>
          </div>

          {/* Filter Chips */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {["Free", "Paid", "Garage", "Street"].map((filter) => (
              <button
                key={filter}
                onClick={() => toggleFilter(filter)}
                className={`px-3 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all ${filters.includes(filter)
                    ? 'bg-[#7FA98E] text-white shadow-sm'
                    : isDark
                      ? 'bg-[#3A3A3C] text-[#AEAEB2] border border-[#48484A]'
                      : 'bg-[#F5F1E8] text-[#8A8D91] border border-[#D3D5D7]'
                  }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* Spot Cards */}
          <div className="space-y-3">
            {filteredSpots.map((spot) => (
              <SpotCard key={spot.id} spot={spot} />
            ))}

            {filteredSpots.length === 0 && !loading && (
              <div className={`text-center py-8 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                <p>No spots match your filters</p>
                <button
                  onClick={() => setFilters(["Free", "Paid", "Garage", "Street"])}
                  className="mt-2 text-[#7FA98E] underline"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* I'm Parked Modal */}
      {showParkedModal && (
        <div className={`absolute inset-0 backdrop-blur-sm flex items-end z-30 ${isDark ? 'bg-[#000000]/60' : 'bg-[#4A4F55]/60'
          }`}>
          <div className={`w-full rounded-t-3xl p-6 animate-slide-up ${isDark ? 'bg-[#2C2C2E]' : 'bg-white'
            }`}>
            <div className="flex justify-between items-center mb-6">
              <h2 className={`text-2xl font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>How long are you staying?</h2>
              <button onClick={() => setShowParkedModal(false)} className={isDark ? 'text-[#AEAEB2] hover:text-[#F5F5F7]' : 'text-[#8A8D91] hover:text-[#4A4F55]'}>
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {["15m", "30m", "1hr", "2hr"].map((duration) => (
                <button
                  key={duration}
                  onClick={() => setShowParkedModal(false)}
                  className={`py-4 rounded-2xl border hover:border-[#7FA98E] transition-all ${isDark
                      ? 'bg-[#3A3A3C] border-[#48484A] text-[#F5F5F7]'
                      : 'bg-[#F5F1E8] border-[#D3D5D7] text-[#4A4F55]'
                    }`}
                >
                  <span className="text-lg">{duration}</span>
                </button>
              ))}
            </div>

            <button className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#8B9D83] to-[#7FA98E] text-white font-semibold mb-3 shadow-md">
              Not sure
            </button>

            <div className={`flex items-center justify-between p-4 rounded-xl ${isDark ? 'bg-[#3A3A3C]' : 'bg-[#F5F1E8]'
              }`}>
              <span className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>Meter reminder</span>
              <div className="w-12 h-6 bg-[#7FA98E] rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* I'm Leaving Modal */}
      {showLeavingModal && (
        <LeavingModal onClose={() => setShowLeavingModal(false)} />
      )}
    </div>
  );
}
