import fs from 'node:fs/promises';
import path from 'node:path';

import type { Logger } from '@/libs/Logger';

export interface UploadedFile {
  localPath: string;
  publicUrl: string;
  fileName: string;
}

/**
 * Helper class for uploading files to temporary public storage
 * for use with Rendi API (which requires publicly accessible URLs)
 *
 * TODO: Implement actual cloud storage upload (S3, Cloudflare R2, etc.)
 * For now, this is a placeholder that would need to be connected to your storage provider
 */
export class FileUploadHelper {
  private logger?: Logger;

  constructor(logger?: Logger) {
    this.logger = logger;
  }

  /**
   * Upload a local file to temporary public storage
   * Returns a publicly accessible URL
   *
   * @param localPath - Path to the local file
   * @returns Public URL where the file can be accessed
   */
  async uploadToPublicStorage(localPath: string): Promise<string> {
    this.logger?.info('Uploading file to public storage', { localPath });

    // TODO: Implement actual upload to S3/R2/etc.
    // For now, this is a placeholder that assumes files are already accessible
    // or would need to be uploaded to your cloud storage provider

    const fileName = path.basename(localPath);

    // Check if file exists
    try {
      await fs.access(localPath);
    } catch {
      throw new Error(`File not found: ${localPath}`);
    }

    // PLACEHOLDER: In production, you would:
    // 1. Upload file to S3/R2/etc.
    // 2. Get public URL
    // 3. Return the URL

    // For development/testing, you might use:
    // - Rendi's file storage API (if they provide one)
    // - Your own S3 bucket
    // - Cloudflare R2
    // - Any other public storage service

    throw new Error(
      'FileUploadHelper.uploadToPublicStorage() not implemented. '
      + 'Please implement cloud storage upload (S3, R2, etc.) or use Rendi file storage API. '
      + `File: ${fileName}`,
    );
  }

  /**
   * Upload multiple files and return a mapping of local paths to public URLs
   */
  async uploadMultipleFiles(
    localPaths: string[],
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    for (const localPath of localPaths) {
      const publicUrl = await this.uploadToPublicStorage(localPath);
      urlMap.set(localPath, publicUrl);
    }

    return urlMap;
  }

  /**
   * Clean up uploaded files after processing (optional)
   */
  async cleanupUploadedFile(publicUrl: string): Promise<void> {
    this.logger?.info('Cleaning up uploaded file', { publicUrl });

    // TODO: Implement cleanup if needed
    // This would delete the file from your cloud storage
  }
}
