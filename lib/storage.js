"use server";

import { unlink } from "fs/promises";
import path from "path";

/**
 * Delete a file from the public folder storage
 * @param {string} fileUrl - The URL path of the file (e.g., "/uploads/image.jpg" or "/gallery/slug/image.jpg")
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deleteFileFromStorage(fileUrl) {
  if (!fileUrl) {
    return { success: false, error: "No file URL provided" };
  }

  try {
    // Skip external URLs
    if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
      return { success: true }; // External files can't be deleted
    }

    // Convert URL to file path
    // URL format: /folder/subfolder/filename.ext
    const relativePath = fileUrl.startsWith("/") ? fileUrl.slice(1) : fileUrl;
    const filePath = path.join(process.cwd(), "public", relativePath);

    // Delete the file
    await unlink(filePath);
    console.log(`Deleted file: ${filePath}`);
    return { success: true };
  } catch (error) {
    // File might not exist, which is fine
    if (error.code === "ENOENT") {
      console.log(`File not found (already deleted?): ${fileUrl}`);
      return { success: true };
    }
    console.error(`Failed to delete file ${fileUrl}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Delete multiple files from storage
 * @param {string[]} fileUrls - Array of file URLs to delete
 * @returns {Promise<{success: boolean, deleted: number, failed: number}>}
 */
export async function deleteMultipleFilesFromStorage(fileUrls) {
  if (!fileUrls || fileUrls.length === 0) {
    return { success: true, deleted: 0, failed: 0 };
  }

  let deleted = 0;
  let failed = 0;

  for (const url of fileUrls) {
    const result = await deleteFileFromStorage(url);
    if (result.success) {
      deleted++;
    } else {
      failed++;
    }
  }

  return { success: failed === 0, deleted, failed };
}
