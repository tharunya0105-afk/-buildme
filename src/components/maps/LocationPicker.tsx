"use client";

import { useState, useCallback } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface LocationPickerProps {
  onLocationSelect: (location: {
    latitude: number;
    longitude: number;
    formattedAddress: string;
  }) => void;
  initialLatitude?: number | null;
  initialLongitude?: number | null;
  initialAddress?: string;
}

export function LocationPicker({
  onLocationSelect,
  initialLatitude,
  initialLongitude,
  initialAddress = "",
}: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress);
  const [latitude, setLatitude] = useState<number | null>(initialLatitude || null);
  const [longitude, setLongitude] = useState<number | null>(initialLongitude || null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  // Simple geocoding using Nominatim (OpenStreetMap)
  const handleAddressSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setMapError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`,
        {
          headers: {
            "Accept-Language": "en",
          },
        }
      );

      const results = await response.json();

      if (results.length === 0) {
        setMapError("Address not found. Try a different search.");
        setSearching(false);
        return;
      }

      const result = results[0];
      const lat = parseFloat(result.lat);
      const lng = parseFloat(result.lon);
      const formatted = result.display_name || searchQuery;

      setLatitude(lat);
      setLongitude(lng);
      setAddress(formatted);
      setSearchQuery(formatted);

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        formattedAddress: formatted,
      });
    } catch {
      setMapError("Search failed. Check your connection and try again.");
    } finally {
      setSearching(false);
    }
  };

  // Handle map click to place a pin
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      setLatitude(lat);
      setLongitude(lng);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      setSearchQuery(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);

      onLocationSelect({
        latitude: lat,
        longitude: lng,
        formattedAddress: `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
      });
    },
    [onLocationSelect]
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary">
        Location
      </label>

      {/* Address search */}
      <div className="flex gap-2">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search for an address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddressSearch();
              }
            }}
          />
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={handleAddressSearch}
          disabled={searching}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {mapError && (
        <p className="text-sm text-danger">{mapError}</p>
      )}

      {/* Map */}
      <div className="relative h-64 rounded-lg overflow-hidden border border-border bg-surface-alt">
        <LeafletMap
          latitude={latitude}
          longitude={longitude}
          onMapClick={handleMapClick}
        />
      </div>

      {/* Coordinates display */}
      {latitude && longitude && (
        <div className="flex items-center gap-2 text-sm text-text-secondary">
          <MapPin className="h-4 w-4 text-primary" />
          <span>
            {latitude.toFixed(6)}, {longitude.toFixed(6)}
          </span>
        </div>
      )}

      <p className="text-xs text-text-muted">
        Search for an address or click on the map to place a pin.
      </p>
    </div>
  );
}

// Dynamic import for Leaflet map (client-side only)
import dynamic from "next/dynamic";

const LeafletMap = dynamic(
  () => import("./LeafletMap").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-text-muted">
        Loading map...
      </div>
    ),
  }
);
