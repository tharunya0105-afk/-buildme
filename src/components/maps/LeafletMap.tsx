"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface LeafletMapProps {
  latitude: number | null;
  longitude: number | null;
  onMapClick: (lat: number, lng: number) => void;
  markerColor?: "normal" | "attention" | "review";
}

export default function LeafletMap({
  latitude,
  longitude,
  onMapClick,
  markerColor = "normal",
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [mounted, setMounted] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: latitude !== null && longitude !== null ? [latitude, longitude] : [10.8, 78.7], // Default: Tamil Nadu, India
      zoom: latitude !== null && longitude !== null ? 15 : 7,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    map.on("click", (e: L.LeafletMouseEvent) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;
    setMounted(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker position
  useEffect(() => {
    if (!mapInstanceRef.current || !mounted) return;

    // Remove existing marker
    if (markerRef.current) {
      mapInstanceRef.current.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    if (latitude !== null && longitude !== null) {
      const colorMap: Record<string, string> = {
        normal: "#16a34a",
        attention: "#d97706",
        review: "#dc2626",
      };

      const color = colorMap[markerColor] || "#16a34a";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 24px;
          height: 24px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([latitude, longitude], { icon }).addTo(
        mapInstanceRef.current
      );

      markerRef.current = marker;

      mapInstanceRef.current.setView([latitude, longitude], 15);
    }
  }, [latitude, longitude, markerColor, mounted]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full"
      style={{ minHeight: "256px" }}
    />
  );
}
