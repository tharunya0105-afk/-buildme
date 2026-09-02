"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Photo {
  id: string;
  fileUrl: string;
  fileName: string | null;
  latitude: number | null;
  longitude: number | null;
  timestamp: string;
  createdAt: string;
}

interface PhotoGalleryProps {
  photos: Photo[];
  showMetadata?: boolean;
}

export function PhotoGallery({ photos, showMetadata = true }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handlePrevious = () => {
    if (selectedIndex === null || selectedIndex === 0) return;
    setSelectedIndex(selectedIndex - 1);
  };

  const handleNext = () => {
    if (selectedIndex === null || selectedIndex === photos.length - 1) return;
    setSelectedIndex(selectedIndex + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setSelectedIndex(null);
    if (e.key === "ArrowLeft") handlePrevious();
    if (e.key === "ArrowRight") handleNext();
  };

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted">
        <p>No photos in this inspection</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Thumbnail grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {photos.map((photo, index) => (
          <button
            key={photo.id}
            type="button"
            onClick={() => setSelectedIndex(index)}
            className="aspect-square rounded-lg overflow-hidden border border-border hover:border-primary transition-colors bg-surface-alt"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.fileUrl}
              alt={photo.fileName || `Photo ${index + 1}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setSelectedIndex(null)}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="dialog"
          aria-label="Photo viewer"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setSelectedIndex(null)}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white z-10"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Navigation */}
          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrevious();
                }}
                className="absolute left-4 p-2 text-white/80 hover:text-white z-10 disabled:opacity-30"
                disabled={selectedIndex === 0}
              >
                <ChevronLeft className="h-8 w-8" />
              </button>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                className="absolute right-4 p-2 text-white/80 hover:text-white z-10 disabled:opacity-30"
                disabled={selectedIndex === photos.length - 1}
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          {/* Image */}
          <div
            className="max-w-5xl max-h-[85vh] mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photos[selectedIndex].fileUrl}
              alt={photos[selectedIndex].fileName || `Photo ${selectedIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />

            {/* Photo info */}
            {showMetadata && (
              <div className="mt-4 text-white/80 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {formatDate(photos[selectedIndex].createdAt)}
                  </span>
                </div>
                {photos[selectedIndex].latitude &&
                  photos[selectedIndex].longitude && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>Location captured</span>
                    </div>
                  )}
                {photos[selectedIndex].fileName && (
                  <p className="text-white/50 text-xs">
                    {photos[selectedIndex].fileName}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Counter */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/60 text-sm">
            {selectedIndex + 1} / {photos.length}
          </div>
        </div>
      )}
    </div>
  );
}
