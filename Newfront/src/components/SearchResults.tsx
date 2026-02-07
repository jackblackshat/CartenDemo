import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, MapPin, Navigation, SlidersHorizontal, Map, List, DollarSign, Clock, TrendingUp, Calendar, Star, Loader2, Search } from "lucide-react";
import { useDarkMode } from "../context/DarkModeContext.tsx";
import { useGeocoding } from "../hooks/useGeocoding";
import { useUserLocation } from "../hooks/useUserLocation";
import type { GeocodingResult } from "../types";

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const frequentSpots = [
  {
    id: "freq1",
    name: "Financial District Garage",
    distance: "1.2 mi",
    walkToDestination: "12 min walk",
    confidence: 96,
    type: "Paid",
    price: "$3/hr",
    eta: "8 min drive",
    visits: 24,
  },
  {
    id: "freq2",
    name: "Union Square Lot",
    distance: "0.8 mi",
    walkToDestination: "10 min walk",
    confidence: 92,
    type: "Paid",
    price: "$5/hr",
    eta: "6 min drive",
    visits: 18,
  },
];

const eventSpots = [
  {
    id: "event1",
    name: "Giants Game Parking",
    distance: "2.1 mi",
    walkToDestination: "5 min walk to stadium",
    confidence: 88,
    type: "Event",
    price: "$20 flat",
    eta: "15 min drive",
    event: "SF Giants vs LA Dodgers",
    eventTime: "7:15 PM",
  },
  {
    id: "event2",
    name: "Chase Center Garage B",
    distance: "1.8 mi",
    walkToDestination: "3 min walk",
    confidence: 91,
    type: "Event",
    price: "$15 flat",
    eta: "12 min drive",
    event: "Warriors Game Tonight",
    eventTime: "7:30 PM",
  },
];

const nearbySpots = [
  {
    id: "1",
    name: "Market Street",
    distance: "0.2 mi",
    walkToDestination: "5 min walk",
    confidence: 94,
    type: "Free",
    eta: "3 min drive",
  },
  {
    id: "2",
    name: "Valencia Street",
    distance: "0.4 mi",
    walkToDestination: "8 min walk",
    confidence: 87,
    type: "Free",
    eta: "5 min drive",
  },
  {
    id: "3",
    name: "Mission Street Garage",
    distance: "0.6 mi",
    walkToDestination: "3 min walk",
    confidence: 99,
    type: "Paid",
    price: "$4/hr",
    eta: "7 min drive",
  },
];

export default function SearchResults() {
  const navigate = useNavigate();
  const { isDark } = useDarkMode();
  const [showMap, setShowMap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDestination, setSelectedDestination] = useState<GeocodingResult | null>(null);

  // Hooks
  const { results: geocodeResults, loading: geocodeLoading, search: geocodeSearch, clear: clearGeocode } = useGeocoding();
  const { location: userLocation } = useUserLocation();

  // Debounce search query
  const debouncedQuery = useDebounce(searchQuery, 300);

  // Search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim().length >= 2) {
      geocodeSearch(debouncedQuery);
    } else {
      clearGeocode();
    }
  }, [debouncedQuery, geocodeSearch, clearGeocode]);

  // Calculate distance from user location to result
  const calculateDistance = useCallback((result: GeocodingResult): string => {
    if (!userLocation) return "";

    const [lng, lat] = result.center;
    const R = 3959; // Earth's radius in miles
    const dLat = (lat - userLocation.lat) * Math.PI / 180;
    const dLng = (lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(userLocation.lat * Math.PI / 180) * Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return `${distance.toFixed(1)} mi`;
  }, [userLocation]);

  // Handle selecting a destination
  const handleSelectDestination = (result: GeocodingResult) => {
    setSelectedDestination(result);
    // Store in sessionStorage for the navigation page
    sessionStorage.setItem('selectedDestination', JSON.stringify({
      name: result.place_name,
      lat: result.center[1],
      lng: result.center[0],
    }));
    navigate('/navigate');
  };

  const totalSpots = frequentSpots.length + eventSpots.length + nearbySpots.length;
  const showSearchResults = searchQuery.trim().length >= 2;

  return (
    <div className={`h-full flex flex-col ${isDark ? 'bg-[#1C1C1E]' : 'bg-[#F5F1E8]'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 backdrop-blur-xl border-b shadow-sm ${isDark
          ? 'bg-[#2C2C2E]/90 border-[#3A3A3C]'
          : 'bg-white/90 border-[#D3D5D7]'
        }`}>
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => navigate(-1)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border ${isDark
                  ? 'bg-[#3A3A3C] text-[#F5F5F7] border-[#48484A]'
                  : 'bg-[#F5F1E8] text-[#4A4F55] border-[#D3D5D7]'
                }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
              <input
                type="text"
                placeholder="Search destination..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className={`w-full rounded-xl pl-10 pr-4 py-2 border focus:border-[#7FA98E] focus:outline-none ${isDark
                    ? 'bg-[#3A3A3C] text-[#F5F5F7] border-[#48484A] placeholder:text-[#AEAEB2]'
                    : 'bg-white text-[#4A4F55] border-[#D3D5D7]'
                  }`}
              />
              {geocodeLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-[#7FA98E]" />
              )}
            </div>
          </div>

          {/* Filter Bar - only show when not searching */}
          {!showSearchResults && (
            <div className="flex items-center gap-2">
              <button className={`flex-1 py-2 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm ${isDark
                  ? 'bg-[#3A3A3C] border-[#48484A] text-[#F5F5F7]'
                  : 'bg-white border-[#D3D5D7] text-[#4A4F55]'
                }`}>
                <SlidersHorizontal className="w-4 h-4" />
                Filter
              </button>
              <button className={`flex-1 py-2 px-4 rounded-xl border flex items-center justify-center gap-2 text-sm ${isDark
                  ? 'bg-[#3A3A3C] border-[#48484A] text-[#F5F5F7]'
                  : 'bg-white border-[#D3D5D7] text-[#4A4F55]'
                }`}>
                Sort: Distance
              </button>
              <button
                onClick={() => setShowMap(!showMap)}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center ${isDark
                    ? 'bg-[#3A3A3C] border-[#48484A] text-[#F5F5F7]'
                    : 'bg-white border-[#D3D5D7] text-[#4A4F55]'
                  }`}
              >
                {showMap ? <List className="w-4 h-4" /> : <Map className="w-4 h-4" />}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto pb-20">
        <div className="p-4 space-y-6">

          {/* Search Results from Geocoding API */}
          {showSearchResults && (
            <div>
              <p className={`text-sm mb-3 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                {geocodeLoading ? 'Searching...' : `${geocodeResults.length} results found`}
              </p>

              {geocodeResults.length > 0 && (
                <div className="space-y-2">
                  {geocodeResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectDestination(result)}
                      className={`w-full text-left rounded-xl p-4 border hover:border-[#7FA98E] transition-all ${isDark
                          ? 'bg-[#2C2C2E] border-[#3A3A3C]'
                          : 'bg-white border-[#D3D5D7]'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#3A3A3C]' : 'bg-[#F5F1E8]'
                          }`}>
                          <MapPin className="w-5 h-5 text-[#7FA98E]" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold truncate ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>
                            {result.text}
                          </h3>
                          <p className={`text-sm truncate ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            {result.place_name}
                          </p>
                          {userLocation && (
                            <p className="text-xs text-[#7FA98E] mt-1">
                              {calculateDistance(result)} away
                            </p>
                          )}
                        </div>
                        <Navigation className="w-5 h-5 text-[#7FA98E] flex-shrink-0" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {!geocodeLoading && geocodeResults.length === 0 && searchQuery.trim().length >= 2 && (
                <div className={`text-center py-8 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                  <p>No results found for "{searchQuery}"</p>
                  <p className="text-sm mt-1">Try a different search term</p>
                </div>
              )}
            </div>
          )}

          {/* Show regular content when not searching */}
          {!showSearchResults && (
            <>
              <p className={`text-sm ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>{totalSpots} spots found</p>

              {/* Most Frequented Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-5 h-5 text-[#C9A96E]" />
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Most Frequented</h3>
                </div>
                <div className="space-y-3">
                  {frequentSpots.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => navigate(`/spot/${result.id}`)}
                      className={`w-full rounded-xl p-4 border-2 border-[#C9A96E]/30 hover:border-[#C9A96E] transition-all cursor-pointer shadow-sm ${isDark ? 'bg-[#2C2C2E]' : 'bg-white'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{result.name}</h3>
                            <span className="px-2 py-0.5 rounded-full bg-[#C9A96E]/20 text-[#C9A96E] text-xs font-semibold">
                              {result.visits} visits
                            </span>
                          </div>
                          <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            <span>{result.distance}</span>
                            <span>•</span>
                            <span>{result.walkToDestination}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E]">
                          <span className="text-sm font-semibold text-[#5F7A61]">{result.confidence}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{result.eta}</span>
                          </div>
                          {result.price && (
                            <div className="flex items-center gap-1.5 text-xs text-[#7FA98E]">
                              <DollarSign className="w-3 h-3" />
                              <span>{result.price}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/navigate");
                          }}
                          className="px-4 py-2 rounded-full bg-[#7FA98E] text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
                        >
                          <Navigation className="w-3 h-3" />
                          Go
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Events Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="w-5 h-5 text-[#7FA98E]" />
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Events Nearby</h3>
                </div>
                <div className="space-y-3">
                  {eventSpots.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => navigate(`/spot/${result.id}`)}
                      className={`w-full rounded-xl p-4 border-2 border-[#7FA98E]/30 hover:border-[#7FA98E] transition-all cursor-pointer shadow-sm ${isDark
                          ? 'bg-gradient-to-br from-[#7FA98E]/10 to-[#2C2C2E]'
                          : 'bg-gradient-to-br from-[#7FA98E]/5 to-white'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{result.name}</h3>
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-3 h-3 text-[#7FA98E]" />
                            <span className="text-xs font-semibold text-[#7FA98E]">{result.event}</span>
                          </div>
                          <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            <span>{result.distance}</span>
                            <span>•</span>
                            <span>{result.walkToDestination}</span>
                            <span>•</span>
                            <span className="text-[#7FA98E]">{result.eventTime}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E]">
                          <span className="text-sm font-semibold text-[#5F7A61]">{result.confidence}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{result.eta}</span>
                          </div>
                          {result.price && (
                            <div className="flex items-center gap-1.5 text-xs text-[#7FA98E] font-semibold">
                              <DollarSign className="w-3 h-3" />
                              <span>{result.price}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/navigate");
                          }}
                          className="px-4 py-2 rounded-full bg-[#7FA98E] text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
                        >
                          <Navigation className="w-3 h-3" />
                          Go
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nearby Spots Section */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className={`w-5 h-5 ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`} />
                  <h3 className={`text-base font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>Nearby Spots</h3>
                </div>
                <div className="space-y-3">
                  {nearbySpots.map((result) => (
                    <div
                      key={result.id}
                      onClick={() => navigate(`/spot/${result.id}`)}
                      className={`w-full rounded-xl p-4 border hover:border-[#7FA98E] transition-all cursor-pointer shadow-sm ${isDark
                          ? 'bg-[#2C2C2E] border-[#3A3A3C]'
                          : 'bg-white border-[#D3D5D7]'
                        }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className={`font-semibold ${isDark ? 'text-[#F5F5F7]' : 'text-[#4A4F55]'}`}>{result.name}</h3>
                            {result.type === "Paid" && (
                              <span className="px-2 py-0.5 rounded-full bg-[#7FA98E]/20 text-[#5F7A61] text-xs">
                                Paid
                              </span>
                            )}
                          </div>
                          <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            <span>{result.distance}</span>
                            <span>•</span>
                            <span>{result.walkToDestination}</span>
                          </div>
                        </div>
                        <div className="px-3 py-1 rounded-full bg-[#7FA98E]/20 border border-[#7FA98E]">
                          <span className="text-sm font-semibold text-[#5F7A61]">{result.confidence}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`flex items-center gap-1.5 text-xs ${isDark ? 'text-[#AEAEB2]' : 'text-[#8A8D91]'}`}>
                            <Clock className="w-3 h-3" />
                            <span>{result.eta}</span>
                          </div>
                          {result.price && (
                            <div className="flex items-center gap-1.5 text-xs text-[#7FA98E]">
                              <DollarSign className="w-3 h-3" />
                              <span>{result.price}</span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate("/navigate");
                          }}
                          className="px-4 py-2 rounded-full bg-[#7FA98E] text-white text-sm font-semibold flex items-center gap-2 shadow-sm"
                        >
                          <Navigation className="w-3 h-3" />
                          Go
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
