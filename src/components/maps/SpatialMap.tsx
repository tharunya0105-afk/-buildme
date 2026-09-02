"use client";

import { useEffect, useRef } from "react";
import type { SpatialProject } from "@/lib/spatial/types";
import { CONSTRUCTION_STAGES } from "@/lib/types";

interface SpatialMapProps {
  projects: SpatialProject[];
  onSelectProject: (project: SpatialProject) => void;
  selectedProjectId?: string;
}

const ATTENTION_COLORS: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

const ATTENTION_BG: Record<string, string> = {
  low: "#f0fdf4",
  medium: "#fffbeb",
  high: "#fef2f2",
};

function getStageLabel(stage: string | null) {
  if (!stage) return "—";
  return CONSTRUCTION_STAGES.find((s) => s.value === stage)?.label || stage;
}

function formatDate(date: string | null) {
  if (!date) return "Never";
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function SpatialMap({
  projects,
  onSelectProject,
  selectedProjectId,
}: SpatialMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<unknown>(null);
  const markersRef = useRef<unknown[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import of Leaflet
    const initMap = async () => {
      const L = (await import("leaflet")).default;

      // Create map centered on Tamil Nadu
      const map = L.map(mapRef.current!, {
        center: [10.8, 78.5],
        zoom: 7,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add markers
      updateMarkers(L, map, projects);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        (mapInstanceRef.current as { remove: () => void }).remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;

    const loadLeaflet = async () => {
      const L = (await import("leaflet")).default;
      updateMarkers(L, mapInstanceRef.current as L.Map, projects);
    };

    loadLeaflet();
  }, [projects, selectedProjectId]);

  function updateMarkers(
    L: typeof import("leaflet"),
    map: L.Map,
    projectList: SpatialProject[]
  ) {
    // Clear existing markers
    markersRef.current.forEach((marker) => {
      (marker as L.Marker).remove();
    });
    markersRef.current = [];

    const bounds: L.LatLngExpression[] = [];

    projectList.forEach((project) => {
      if (!project.latitude || !project.longitude) return;

      const color = ATTENTION_COLORS[project.attentionScore.level];
      const bgColor = ATTENTION_BG[project.attentionScore.level];

      // Create custom icon with attention color
      const icon = L.divIcon({
        className: "custom-marker",
        html: `
          <div style="
            position: relative;
            width: 36px;
            height: 36px;
          ">
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50% 50% 50% 0;
              background: ${bgColor};
              border: 3px solid ${color};
              transform: rotate(-45deg);
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
              <span style="
                transform: rotate(45deg);
                font-size: 12px;
                font-weight: bold;
                color: ${color};
              ">${project.attentionScore.score}</span>
            </div>
            ${project.id === selectedProjectId ? `
              <div style="
                position: absolute;
                top: -6px;
                left: -6px;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                border: 2px solid ${color};
                opacity: 0.5;
                animation: pulse 1.5s infinite;
              "></div>
            ` : ""}
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 36],
        popupAnchor: [0, -36],
      });

      const marker = L.marker([project.latitude, project.longitude], { icon })
        .addTo(map);

      // Popup content
      const popupContent = `
        <div style="min-width: 200px; font-family: system-ui, sans-serif;">
          <div style="font-weight: 600; font-size: 14px; margin-bottom: 4px;">
            ${project.name}
          </div>
          <div style="font-size: 12px; color: #64748b; margin-bottom: 8px;">
            ${project.address}, ${project.city}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 12px;">
            <div style="color: #64748b;">Stage</div>
            <div style="font-weight: 500;">${getStageLabel(project.currentStage)}</div>
            <div style="color: #64748b;">Client</div>
            <div style="font-weight: 500;">${project.homeownerName || "—"}</div>
            <div style="color: #64748b;">Last Inspection</div>
            <div style="font-weight: 500;">${formatDate(project.lastInspectionDate)}</div>
            <div style="color: #64748b;">Open Issues</div>
            <div style="font-weight: 500; ${project.openIssues > 0 ? "color: #dc2626;" : ""}">${project.openIssues}</div>
            <div style="color: #64748b;">Attention</div>
            <div style="font-weight: 500; color: ${color};">${project.attentionScore.score}/100</div>
          </div>
          <div style="margin-top: 8px;">
            <a href="/engineer/sites/${project.id}" style="
              display: inline-block;
              padding: 4px 12px;
              background: #1a56db;
              color: white;
              border-radius: 4px;
              text-decoration: none;
              font-size: 12px;
              font-weight: 500;
            ">Open Site</a>
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on("click", () => {
        onSelectProject(project);
      });

      markersRef.current.push(marker);
      bounds.push([project.latitude, project.longitude]);
    });

    // Fit bounds if we have markers
    if (bounds.length > 0) {
      map.fitBounds(bounds as [number, number][], { padding: [50, 50], maxZoom: 12 });
    }
  }

  return (
    <div ref={mapRef} className="h-full w-full" />
  );
}
