import React, { useState, useEffect } from "react";
import TripPlanner from "./TripPlanner";
import TripMap from "./TripMap";

const AWS_REGION = "us-east-2";
const API_KEY = import.meta.env.VITE_AWS_MAPS_API_KEY;

export default function TripPage() {
  const [places, setPlaces] = useState([]);
  const [startLocation, setStartLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [mode, setMode] = useState("driving");
  const [loading, setLoading] = useState(false);
  const [tripResponse, setTripResponse] = useState(null);
  
  // Start location search state
  const [startLocationQuery, setStartLocationQuery] = useState("");
  const [startLocationSuggestions, setStartLocationSuggestions] = useState([]);
  const [startLocationLoading, setStartLocationLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);

  // Get user location once
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation([pos.coords.longitude, pos.coords.latitude]),
        () => setUserLocation([-122.009, 37.3349]) // Cupertino fallback
      );
    } else {
      setUserLocation([-122.009, 37.3349]);
    }
  }, []);

  // Fetch start location suggestions
  const fetchStartLocationSuggestions = async (text) => {
    if (text.trim().length < 3 || !userLocation) {
      setStartLocationSuggestions([]);
      return;
    }

    setStartLocationLoading(true);
    try {
      const res = await fetch(`/places/v2/search-text?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          QueryText: text,
          BiasPosition: userLocation,
          MaxResults: 5,
        }),
      });

      const data = await res.json();
      const results =
        data.ResultItems?.map((r) => ({
          title: r.Title,
          placeId: r.PlaceId,
          address: r.Address?.Label || "",
          coordinates: r.Position,
        })) || [];

      setStartLocationSuggestions(results);
    } catch (err) {
      console.error("Start location search error:", err);
      setStartLocationSuggestions([]);
    } finally {
      setStartLocationLoading(false);
    }
  };

  // Handle current location selection
  const handleUseCurrentLocation = async () => {
    if (!userLocation) {
      alert("Unable to get current location");
      return;
    }

    try {
      // Reverse geocode to get location name
      const res = await fetch(`/places/v2/search-position?key=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          Position: userLocation,
        }),
      });

      const data = await res.json();
      const locationName = data.Result?.Place?.Label || "Current Location";
      setStartLocation(locationName);
      setStartLocationQuery(locationName);
      setStartLocationSuggestions([]);
    } catch (err) {
      console.error("Reverse geocode error:", err);
      setStartLocation("Current Location");
      setStartLocationQuery("Current Location");
    }
  };

  // Handle start location selection from dropdown
  const handleSelectStartLocation = (place) => {
    setStartLocation(place.title);
    setStartLocationQuery(place.title);
    setStartLocationSuggestions([]);
  };

  const handleAddPlace = (place) => {
    setPlaces((prev) => [...prev, place]);
  };

  const handleRemovePlace = (index) => {
    setPlaces((prev) => prev.filter((_, i) => i !== index));
  };

  const handleInitTrip = async () => {
    if (!startLocation || places.length === 0) {
      alert("Please add a start location and at least one stop");
      return;
    }

    setLoading(true);
    try {
      // Format stops as [location_name, place_id]
      const stops = places.map((place) => [place.title, place.placeId]);

      // Get auth token from session storage
      const token = sessionStorage.getItem("access_token");

      // Combine date and time into ISO format
      const formatDateTime = (date, time) => {
        if (!date || !time) {
          return new Date().toISOString();
        }
        const dateTime = new Date(`${date}T${time}`);
        return dateTime.toISOString();
      };

      const startDateTime = formatDateTime(startDate, startTime);
      const endDateTime = formatDateTime(endDate, endTime);

      const requestBody = {
        startLocation,
        startTime: startDateTime,
        endTime: endDateTime,
        mode,
        stops,
      };

      console.log("🚀 Sending trip init request:", requestBody);

      const response = await fetch(
        `/api/prod/trip/init`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const data = await response.json();
      console.log("✅ Trip init response:", data);

      if (!response.ok) {
        console.error("❌ Trip init failed:", data);
        setTripResponse(null);
      } else {
        setTripResponse(data);
      }
    } catch (err) {
      console.error("❌ Trip init error:", err);
      setTripResponse(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row bg-black text-white h-screen overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6">
        {/* Trip Configuration */}
        <div className="mb-6 space-y-4 bg-white/5 p-6 rounded-xl border border-white/20 backdrop-blur-sm">
          <h3 className="text-xl font-semibold mb-4 text-white">Trip Configuration</h3>
          
          <div className="space-y-4">
            {/* Start Location Search */}
            <div className="relative">
              <label className="block text-sm mb-2 text-white/70 font-medium">Start Location</label>
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Search for a location..."
                    value={startLocationQuery}
                    onChange={(e) => {
                      const value = e.target.value;
                      setStartLocationQuery(value);
                      fetchStartLocationSuggestions(value);
                    }}
                    onFocus={() => {
                      if (startLocationQuery.length >= 3) {
                        fetchStartLocationSuggestions(startLocationQuery);
                      }
                    }}
                    className="w-full bg-black/40 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all"
                  />
                  
                  {startLocationLoading && (
                    <p className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 text-xs animate-pulse">
                      Searching...
                    </p>
                  )}

                  {/* Suggestions Dropdown */}
                  {startLocationSuggestions.length > 0 && (
                    <ul className="absolute left-0 right-0 mt-2 bg-black/95 text-white border border-white/30 rounded-lg shadow-2xl backdrop-blur-xl overflow-hidden z-[99999] max-h-60 overflow-y-auto">
                      {startLocationSuggestions.map((s, i) => (
                        <li
                          key={`${s.placeId ?? s.title}-${i}`}
                          onClick={() => handleSelectStartLocation(s)}
                          className="p-3 hover:bg-white/20 cursor-pointer transition-colors border-b border-white/10 last:border-b-0"
                        >
                          <span className="font-medium block">{s.title}</span>
                          {s.address && (
                            <p className="text-xs text-white/60 truncate mt-1">{s.address}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <button
                  onClick={handleUseCurrentLocation}
                  className="bg-white/10 border border-white/30 hover:bg-white/20 text-white px-4 py-3 rounded-lg transition-colors whitespace-nowrap font-medium"
                  title="Use Current Location"
                >
                  Use Current
                </button>
              </div>
              {startLocation && (
                <p className="text-xs text-white/70 mt-2">
                  Selected: <span className="text-white font-medium">{startLocation}</span>
                </p>
              )}
            </div>

            {/* Start Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-2 text-white/70 font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-white/70 font-medium">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>

            {/* End Date and Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm mb-2 text-white/70 font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
              <div>
                <label className="block text-sm mb-2 text-white/70 font-medium">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full bg-black/40 border border-white/30 rounded-lg px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2 text-white/70 font-medium">Mode</label>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value)}
                className="w-full bg-black/40 border border-white/30 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-white focus:ring-2 focus:ring-white/20 transition-all"
              >
                <option value="driving">Driving</option>
                <option value="walking">Walking</option>
                <option value="cycling">Cycling</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleInitTrip}
            disabled={loading || !startLocation || places.length === 0}
            className="w-full bg-white text-black py-3 px-6 rounded-lg font-semibold hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
          >
            {loading ? "Initializing..." : "Initialize Trip"}
          </button>
        </div>

        {/* Trip Response Cards */}
        {tripResponse && tripResponse.itinerary && (
          <div className="mb-6 bg-white/5 p-6 rounded-xl border border-white/20 backdrop-blur-sm">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-white mb-2">Trip Itinerary</h3>
              <div className="flex gap-4 text-sm text-white/70">
                <p>Trip ID: <span className="text-white font-mono">{tripResponse.tripId}</span></p>
                <p>Duration: <span className="text-white">{tripResponse.tripDurationMinutes} minutes</span></p>
              </div>
            </div>
            
            <div className="space-y-3">
              {tripResponse.itinerary.map((item, index) => (
                <div
                  key={index}
                  className="bg-black/40 border border-white/30 rounded-lg p-4 hover:bg-black/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-white/60">#{index + 1}</span>
                        <h4 className="text-lg font-semibold text-white">{item.spotname}</h4>
                      </div>
                      <p className="text-sm text-white/70 mb-2">{item.reason}</p>
                      <div className="flex gap-4 text-xs text-white/60">
                        <span>Arrive by: <span className="text-white/80 font-medium">{item.reachtime}</span></span>
                        <span>Coordinates: <span className="text-white/80 font-mono">{item.coordinates.lat.toFixed(5)}, {item.coordinates.lon.toFixed(5)}</span></span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TripPlanner
          places={places}
          onAddPlace={handleAddPlace}
          onRemovePlace={handleRemovePlace}
        />
      </div>
      <div className="flex-1 flex items-center justify-center">
        <TripMap places={tripResponse?.itinerary ? tripResponse.itinerary.map(item => ({
          title: item.spotname,
          coordinates: [item.coordinates.lon, item.coordinates.lat],
          address: item.reason,
          reachtime: item.reachtime
        })) : places} />
      </div>
    </div>
  );
}
