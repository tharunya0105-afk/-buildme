"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface Project {
  id: string;
  name: string;
  address: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  currentStage: string | null;
  status: string;
  progress: number;
  updatedAt: string;
}

interface MapWithMarkersProps {
  projects: Project[];
  onSelectProject: (project: Project) => void;
  selectedProjectId?: string;
}

export default function MapWithMarkers({
  projects,
  onSelectProject,
  selectedProjectId,
}: MapWithMarkersProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Center on Tamil Nadu by default, or on first project with coordinates
    const firstCoords = projects.find(p => p.latitude && p.longitude);
    const defaultCenter: [number, number] = firstCoords
      ? [firstCoords.latitude!, firstCoords.longitude!]
      : [10.8, 78.7]; // Tamil Nadu, India

    const map = L.map(mapRef.current, {
      center: defaultCenter,
      zoom: firstCoords ? 12 : 7,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    mapInstanceRef.current = map;
    setMounted(true);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update markers when projects change
  useEffect(() => {
    if (!mapInstanceRef.current || !mounted) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current.clear();

    const bounds: [number, number][] = [];

    projects.forEach((project) => {
      if (!project.latitude || !project.longitude) return;

      const colorMap: Record<string, string> = {
        normal: "#16a34a",
        attention: "#d97706",
        review: "#dc2626",
      };

      const color = colorMap[project.status] || "#16a34a";

      const icon = L.divIcon({
        className: "custom-marker",
        html: `<div style="
          width: 32px;
          height: 32px;
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: bold;
        ">${project.progress}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([project.latitude, project.longitude], {
        icon,
      }).addTo(mapInstanceRef.current!);

      // Popup content
      const popupContent = `
        <div style="min-width: 180px; padding: 4px;">
          <h3 style="font-size: 14px; font-weight: 600; margin: 0 0 4px 0;">${project.name}</h3>
          <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">${project.address}${project.city ? `, ${project.city}` : ""}</p>
          <div style="display: flex; gap: 8px; font-size: 12px; color: #666; margin-bottom: 8px;">
            <span>${project.currentStage || "—"}</span>
            <span>·</span>
            <span>${project.progress}%</span>
          </div>
          <a href="/engineer/sites/${project.id}" style="display: inline-block; padding: 4px 12px; background: #1a56db; color: white; border-radius: 4px; text-decoration: none; font-size: 12px; font-weight: 500;">Open Site</a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onSelectProject(project);
      });

      markersRef.current.set(project.id, marker);
      bounds.push([project.latitude, project.longitude]);
    });

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [projects, mounted, onSelectProject]);

  // Highlight selected marker
  useEffect(() => {
    if (!mounted) return;

    markersRef.current.forEach((marker, id) => {
      if (id === selectedProjectId) {
        marker.openPopup();
      }
    });
  }, [selectedProjectId, mounted]);

  return (
    <div
      ref={mapRef}
      className="h-full w-full"
      style={{ minHeight: "400px" }}
    />
  );
}
