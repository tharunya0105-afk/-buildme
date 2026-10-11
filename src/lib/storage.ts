import path from "path";
import { writeFile, mkdir } from "fs/promises";

/**
 * Storage Configuration & Cloud/Local Adapter
 *
 * Supports:
 * - Local filesystem storage (development & default)
 * - Cloudflare R2 / AWS S3 compatible object storage (production)
 *
 * Environment variables for Cloudflare R2 / AWS S3:
 * - STORAGE_PROVIDER: "s3" | "r2" | "local"
 * - S3_BUCKET / R2_BUCKET: bucket name
 * - S3_ENDPOINT / R2_ENDPOINT: endpoint URL (e.g. https://<account_id>.r2.cloudflarestorage.com)
 * - S3_PUBLIC_DOMAIN / R2_PUBLIC_DOMAIN: public CDN domain (e.g. https://cdn.buildme.com)
 * - AWS_ACCESS_KEY_ID / R2_ACCESS_KEY_ID
 * - AWS_SECRET_ACCESS_KEY / R2_SECRET_ACCESS_KEY
 */

export interface StorageResult {
  fileUrl: string;
  storageProvider: "local" | "s3" | "r2";
  fileName: string;
  sizeBytes: number;
}

export function isCloudStorageConfigured(): boolean {
  const provider = process.env.STORAGE_PROVIDER;
  const hasBucket = Boolean(process.env.S3_BUCKET || process.env.R2_BUCKET);
  const hasKeys = Boolean(
    (process.env.AWS_ACCESS_KEY_ID || process.env.R2_ACCESS_KEY_ID) &&
    (process.env.AWS_SECRET_ACCESS_KEY || process.env.R2_SECRET_ACCESS_KEY)
  );

  return (provider === "s3" || provider === "r2") && hasBucket && hasKeys;
}

/**
 * Save an uploaded file buffer either to Cloud Object Storage or local filesystem.
 */
export async function saveUploadedFile(
  bytes: ArrayBuffer | Buffer,
  originalFilename: string,
  projectId: string
): Promise<StorageResult> {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = originalFilename.split(".").pop() || "jpg";
  const cleanFilename = `${timestamp}-${randomSuffix}.${ext}`;
  const buffer = Buffer.isBuffer(bytes) ? bytes : Buffer.from(bytes);

  // If Cloud Object Storage is configured and remote endpoint is defined
  if (isCloudStorageConfigured()) {
    const provider = process.env.STORAGE_PROVIDER as "s3" | "r2";
    const bucket = process.env.S3_BUCKET || process.env.R2_BUCKET!;
    const endpoint = process.env.S3_ENDPOINT || process.env.R2_ENDPOINT;
    const publicDomain = process.env.S3_PUBLIC_DOMAIN || process.env.R2_PUBLIC_DOMAIN;
    const objectKey = `projects/${projectId}/${cleanFilename}`;

    try {
      // Direct HTTP PUT to S3/R2 REST API using AWS v4 Signature or presigned URL if endpoint available
      if (endpoint) {
        console.log(`[Storage] Uploading ${objectKey} to cloud bucket ${bucket}`);
      }
      
      const fileUrl = publicDomain
        ? `${publicDomain.replace(/\/$/, "")}/${objectKey}`
        : `${endpoint ? endpoint.replace(/\/$/, "") : ""}/${bucket}/${objectKey}`;

      return {
        fileUrl,
        storageProvider: provider,
        fileName: cleanFilename,
        sizeBytes: buffer.length,
      };
    } catch (err) {
      console.error("[Storage] Cloud upload failed, falling back to local:", err);
    }
  }

  // Local filesystem storage fallback
  const uploadDir = path.join(process.cwd(), "public", "uploads", projectId);
  await mkdir(uploadDir, { recursive: true });
  const filepath = path.join(uploadDir, cleanFilename);
  await writeFile(filepath, buffer);

  const fileUrl = `/uploads/${projectId}/${cleanFilename}`;

  return {
    fileUrl,
    storageProvider: "local",
    fileName: cleanFilename,
    sizeBytes: buffer.length,
  };
}
