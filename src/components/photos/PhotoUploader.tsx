"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface PhotoUploaderProps {
  projectId: string;
  inspectionId?: string;
  onPhotosUploaded: (photos: PhotoData[]) => void;
  existingPhotos?: PhotoData[];
  maxPhotos?: number;
}

export interface PhotoData {
  id: string;
  fileUrl: string;
  fileName: string | null;
  createdAt: string;
}

interface PendingPhoto {
  file: File;
  preview: string;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

export function PhotoUploader({
  projectId,
  inspectionId,
  onPhotosUploaded,
  existingPhotos = [],
  maxPhotos = 50,
}: PhotoUploaderProps) {
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [location, setLocation] = useState<{
    latitude: number | null;
    longitude: number | null;
  }>({ latitude: null, longitude: null });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Request location on mount
  const requestLocation = useCallback(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          // Location not available - that's fine
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    }
  }, []);

  // Request location when component mounts
  useState(() => {
    requestLocation();
  });

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newPhotos: PendingPhoto[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!file.type.startsWith("image/")) {
        continue;
      }

      // Validate file size (20MB max)
      if (file.size > 20 * 1024 * 1024) {
        continue;
      }

      // Check max photos
      if (pendingPhotos.length + newPhotos.length >= maxPhotos) {
        break;
      }

      const preview = URL.createObjectURL(file);
      newPhotos.push({
        file,
        preview,
        uploading: false,
        uploaded: false,
      });
    }

    if (newPhotos.length > 0) {
      setPendingPhotos((prev) => [...prev, ...newPhotos]);
    }
  };

  const removePendingPhoto = (index: number) => {
    setPendingPhotos((prev) => {
      const photo = prev[index];
      if (photo.preview) {
        URL.revokeObjectURL(photo.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const uploadAllPhotos = async (): Promise<PhotoData[]> => {
    const uploadedPhotos: PhotoData[] = [];

    for (let i = 0; i < pendingPhotos.length; i++) {
      const photo = pendingPhotos[i];

      if (photo.uploaded) continue;

      setPendingPhotos((prev) =>
        prev.map((p, idx) =>
          idx === i ? { ...p, uploading: true, error: undefined } : p
        )
      );

      try {
        const formData = new FormData();
        formData.append("file", photo.file);
        formData.append("projectId", projectId);
        if (inspectionId) {
          formData.append("inspectionId", inspectionId);
        }
        if (location.latitude) {
          formData.append("latitude", location.latitude.toString());
        }
        if (location.longitude) {
          formData.append("longitude", location.longitude.toString());
        }

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const uploaded = await response.json();

        setPendingPhotos((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? { ...p, uploading: false, uploaded: true }
              : p
          )
        );

        uploadedPhotos.push({
          id: uploaded.id,
          fileUrl: uploaded.fileUrl,
          fileName: uploaded.fileName,
          createdAt: uploaded.createdAt,
        });
      } catch (error) {
        setPendingPhotos((prev) =>
          prev.map((p, idx) =>
            idx === i
              ? {
                  ...p,
                  uploading: false,
                  error:
                    error instanceof Error
                      ? error.message
                      : "Upload failed",
                }
              : p
          )
        );
      }
    }

    return uploadedPhotos;
  };

  const handleSubmit = async () => {
    if (pendingPhotos.length === 0) return;

    setUploading(true);

    try {
      const uploaded = await uploadAllPhotos();
      if (uploaded.length > 0) {
        onPhotosUploaded(uploaded);
        // Clean up previews
        pendingPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
        setPendingPhotos([]);
      }
    } finally {
      setUploading(false);
    }
  };

  const totalPhotos = existingPhotos.length + pendingPhotos.length;
  const allUploaded = pendingPhotos.every((p) => p.uploaded);
  const hasErrors = pendingPhotos.some((p) => p.error);
  const pendingCount = pendingPhotos.filter((p) => !p.uploaded).length;

  return (
    <div className="space-y-4">
      {/* Upload buttons */}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => cameraInputRef.current?.click()}
          disabled={totalPhotos >= maxPhotos}
        >
          <Camera className="h-4 w-4 mr-2" />
          Take Photo
        </Button>

        <Button
          type="button"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          disabled={totalPhotos >= maxPhotos}
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Photos
        </Button>

        {totalPhotos > 0 && (
          <span className="text-sm text-text-secondary self-center">
            {totalPhotos} photo{totalPhotos !== 1 ? "s" : ""} added
          </span>
        )}
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files);
          e.target.value = "";
        }}
      />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          handleFileSelect(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Photo preview grid */}
      {pendingPhotos.length > 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {pendingPhotos.map((photo, index) => (
              <div
                key={index}
                className="relative aspect-square rounded-lg overflow-hidden border border-border bg-surface-alt group"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.preview}
                  alt={`Photo ${index + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Status overlay */}
                {photo.uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="text-white text-xs font-medium">
                      Uploading...
                    </div>
                  </div>
                )}

                {photo.uploaded && (
                  <div className="absolute inset-0 bg-status-normal/20 flex items-center justify-center">
                    <div className="text-status-normal text-xs font-medium bg-white rounded px-2 py-1">
                      ✓ Uploaded
                    </div>
                  </div>
                )}

                {photo.error && (
                  <div className="absolute inset-0 bg-danger/20 flex items-center justify-center">
                    <div className="text-danger text-xs font-medium bg-white rounded px-2 py-1 text-center max-w-full">
                      {photo.error}
                    </div>
                  </div>
                )}

                {/* Remove button */}
                {!photo.uploading && !photo.uploaded && (
                  <button
                    type="button"
                    onClick={() => removePendingPhoto(index)}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing photos */}
      {existingPhotos.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm text-text-muted">
            {existingPhotos.length} existing photo
            {existingPhotos.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Upload button */}
      {pendingPhotos.length > 0 && !allUploaded && (
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={uploading || pendingCount === 0}
          className="w-full"
        >
          {uploading
            ? `Uploading ${pendingCount} photo${pendingCount !== 1 ? "s" : ""}...`
            : `Upload ${pendingCount} Photo${pendingCount !== 1 ? "s" : ""}`}
        </Button>
      )}

      {/* Error state */}
      {hasErrors && (
        <p className="text-sm text-danger">
          Some photos failed to upload. Check the errors above and try again.
        </p>
      )}

      {totalPhotos === 0 && (
        <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
          <ImageIcon className="h-8 w-8 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-secondary">
            No photos added yet
          </p>
          <p className="text-xs text-text-muted mt-1">
            Take a photo or upload from your device
          </p>
        </div>
      )}
    </div>
  );
}
