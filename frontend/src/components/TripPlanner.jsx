import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import {
  SearchPlaceIndexForTextCommand,
  LocationClient,
} from "@aws-sdk/client-location";
import { locationClient } from "../aws.config";

// Simple car icon URL for markers
const carIcon = "https://cdn-icons-png.flaticon.com/512/743/743922.png";

const TripPlanner = () => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [places, setPlaces] = useState([]);

  // 🧭 Initialize MapLibre + user location
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const initializeMap = async (coords) => {
      const mapInstance = new maplibregl.Map({
        container: mapContainerRef.current,
        style:
          "https://maps.geo.us-east-2.amazonaws.com/maps/v0/maps/OdysseyMap/style-descriptor",
        center: coords || [0, 0],
        zoom: coords ? 12 : 2,
      });

      setMap(mapInstance);

      // Add user location marker
      if (coords) {
        new maplibregl.Marker({ color: "#00BFFF" })
          .setLngLat(coords)
          .setPopup(new maplibregl.Popup().setText("You are here"))
          .addTo(mapInstance);
      }
    };

    // Try to get browser location
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = [pos.coords.longitude, pos.coords.latitude];
        setUserLocation(coords);
        initializeMap(coords);
      },
      () => initializeMap([0, 0])
    );
  }, []);

  // 🔍 Fetch suggestions from AWS Places Index
  const fetchSuggestions = async (text) => {
    if (text.trim().length < 3 || !userLocation) {
      setSuggestions([]);
      return;
    }

    const command = new SearchPlaceIndexForTextCommand({
      IndexName: "OdysseyPlaceIndex",
      Text: text,
      BiasPosition: userLocation, // prioritize nearby results
      MaxResults: 5,
    });

    try {
      const response = await locationClient.send(command);
      const results =
        response.Results?.map((r) => ({
          name: r.Place.Label,
          coordinates: r.Place.Geometry.Point,
        })) || [];
      setSuggestions(results);
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    }
  };

  // ✏️ Handle input change (live search)
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    fetchSuggestions(value);
  };

  // ➕ Add a location to visit list
  const addToTrip = (place) => {
    setPlaces((prev) => [...prev, place]);
    setSuggestions([]);
    setQuery("");

    // Add pin on map
    if (map) {
      new maplibregl.Marker({ color: "#FF4500" })
        .setLngLat(place.coordinates)
        .setPopup(new maplibregl.Popup().setText(place.name))
        .addTo(map);
    }
  };

  return (
    <div className="w-screen h-screen bg-black text-white flex flex-col items-center">
      {/* Search Input + Dropdown */}
      <div className="w-[80%] max-w-2xl mt-8 relative">
        <input
          type="text"
          placeholder="Search nearby places..."
          value={query}
          onChange={handleChange}
          className="w-full p-3 rounded-full bg-white/10 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white"
        />
        {suggestions.length > 0 && (
          <ul className="absolute mt-2 w-full bg-white/10 border border-white/30 rounded-xl overflow-hidden backdrop-blur-md z-10">
            {suggestions.map((s, idx) => (
              <li
                key={idx}
                onClick={() => addToTrip(s)}
                className="p-3 hover:bg-white/20 cursor-pointer"
              >
                {s.name}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Itinerary List */}
      <div className="w-[80%] max-w-2xl mt-6 mb-4">
        <h2 className="text-lg font-semibold mb-2">Your Trip List:</h2>
        <div className="flex flex-col gap-2">
          {places.length > 0 ? (
            places.map((p, idx) => (
              <div
                key={idx}
                className="p-3 bg-white/10 border border-white/30 rounded-lg"
              >
                {p.name}
              </div>
            ))
          ) : (
            <p className="text-white/60">No places added yet.</p>
          )}
        </div>
      </div>

      {/* Map */}
      <div
        ref={mapContainerRef}
        className="w-[90%] h-[60vh] border-2 border-white rounded-lg"
      ></div>
    </div>
  );
};

export default TripPlanner;
