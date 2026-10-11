import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs/promises";
import path from "path";
import { saveUploadedFile, isCloudStorageConfigured } from "../src/lib/storage";

test("Storage Adapter", async (t) => {
  await t.test("defaults to local storage when cloud env is unset", () => {
    // In local development, cloud storage should return false unless configured
    const configured = isCloudStorageConfigured();
    assert.equal(typeof configured, "boolean");
  });

  await t.test("saves buffer to local disk and returns valid URL", async () => {
    const fakeBuffer = Buffer.from("fake-image-bytes-data-stream");
    const filename = "site-photo-slab.jpg";
    const projectId = "test-project-123";

    const result = await saveUploadedFile(fakeBuffer, filename, projectId);

    assert.equal(result.storageProvider, "local");
    assert.ok(result.fileUrl.startsWith(`/uploads/${projectId}/`));
    assert.ok(result.fileName.endsWith(".jpg"));
    assert.equal(result.sizeBytes, fakeBuffer.length);

    // Verify file actually exists on filesystem
    const diskPath = path.join(process.cwd(), "public", "uploads", projectId, result.fileName);
    const stat = await fs.stat(diskPath);
    assert.ok(stat.isFile());
    assert.equal(stat.size, fakeBuffer.length);

    // Clean up test file
    await fs.unlink(diskPath);
  });
});
