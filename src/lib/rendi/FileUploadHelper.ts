// Logger type removed - using optional logger parameter

import type { R2Config } from './R2Uploader';
import { R2Uploader } from './R2Uploader';

export interface UploadedFile {
  localPath: string;
  publicUrl: string;
  fileName: string;
}

/**
 * Helper class for uploading files to cloud storage for use with Rendi API
 * Uses Cloudflare R2 for storage
 */
export class FileUploadHelper {
  private uploader: R2Uploader;

  constructor(config: R2Config, logger?: any) {
    this.uploader = new R2Uploader(config, logger);
  }

  /**
   * Upload a local file to public storage
   * Returns a publicly accessible URL
   */
  async uploadToPublicStorage(localPath: string): Promise<string> {
    return this.uploader.uploadFile(localPath);
  }

  /**
   * Upload multiple files and return a mapping of local paths to public URLs
   */
  async uploadMultipleFiles(
    localPaths: string[],
  ): Promise<Map<string, string>> {
    return this.uploader.uploadMultipleFiles(localPaths);
  }

  /**
   * Clean up uploaded file after processing
   */
  async cleanupUploadedFile(publicUrl: string): Promise<void> {
    await this.uploader.deleteFileByUrl(publicUrl);
  }

  /**
   * Clean up all uploaded files
   */
  async cleanupAll(): Promise<void> {
    await this.uploader.cleanupAll();
  }
}
