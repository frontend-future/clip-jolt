import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';

// Logger type removed - using optional logger parameter

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicDomain?: string; // Optional custom domain for public access
}

/**
 * Cloudflare R2 file uploader
 * Uploads files to R2 and returns public URLs for use with Rendi API
 */
export class R2Uploader {
  private s3Client: S3Client;

  private bucketName: string;

  private publicDomain: string;

  private logger?: any;

  private uploadedFiles: Set<string> = new Set();

  constructor(config: R2Config, logger?: any) {
    // R2 uses S3-compatible API
    this.s3Client = new S3Client({
      region: 'auto', // R2 uses 'auto' for region
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });

    this.bucketName = config.bucketName;
    this.logger = logger;

    // Public domain for accessing files
    // If custom domain is provided, use it; otherwise use R2.dev subdomain
    this.publicDomain
      = config.publicDomain || `https://pub-${config.accountId}.r2.dev`;
  }

  /**
   * Upload a local file to R2 and return its public URL
   */
  async uploadFile(localPath: string): Promise<string> {
    this.logger?.info('Uploading file to R2', { localPath });

    try {
      // Read file
      const fileContent = await fs.readFile(localPath);
      const fileName = path.basename(localPath);
      const timestamp = Date.now();

      // Generate unique key with timestamp to avoid collisions
      const key = `rendi-temp/${timestamp}-${fileName}`;

      // Determine content type
      const contentType = this.getContentType(fileName);

      // Upload to R2
      await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Body: fileContent,
          ContentType: contentType,
        }),
      );

      // Construct public URL
      const publicUrl = `${this.publicDomain}/${key}`;

      // Track uploaded file for cleanup
      this.uploadedFiles.add(key);

      this.logger?.info('File uploaded successfully', {
        localPath,
        publicUrl,
        size: fileContent.length,
      });

      return publicUrl;
    } catch (error) {
      this.logger?.error('Failed to upload file to R2', { localPath, error });
      throw new Error(
        `Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Upload multiple files and return a map of local paths to public URLs
   */
  async uploadMultipleFiles(
    localPaths: string[],
  ): Promise<Map<string, string>> {
    const urlMap = new Map<string, string>();

    for (const localPath of localPaths) {
      const publicUrl = await this.uploadFile(localPath);
      urlMap.set(localPath, publicUrl);
    }

    return urlMap;
  }

  /**
   * Delete a file from R2 using its public URL
   */
  async deleteFileByUrl(publicUrl: string): Promise<void> {
    try {
      // Extract key from URL
      const key = publicUrl.replace(`${this.publicDomain}/`, '');

      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.uploadedFiles.delete(key);

      this.logger?.info('File deleted from R2', { publicUrl, key });
    } catch (error) {
      this.logger?.error('Failed to delete file from R2', { publicUrl, error });
      // Don't throw - cleanup is best effort
    }
  }

  /**
   * Delete a file from R2 using its key
   */
  async deleteFileByKey(key: string): Promise<void> {
    try {
      await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.bucketName,
          Key: key,
        }),
      );

      this.uploadedFiles.delete(key);

      this.logger?.info('File deleted from R2', { key });
    } catch (error) {
      this.logger?.error('Failed to delete file from R2', { key, error });
      // Don't throw - cleanup is best effort
    }
  }

  /**
   * Clean up all files uploaded in this session
   */
  async cleanupAll(): Promise<void> {
    this.logger?.info('Cleaning up all uploaded files', {
      count: this.uploadedFiles.size,
    });

    const deletePromises = Array.from(this.uploadedFiles).map(key =>
      this.deleteFileByKey(key),
    );

    await Promise.allSettled(deletePromises);

    this.uploadedFiles.clear();
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();

    const contentTypes: Record<string, string> = {
      // Video
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska',

      // Audio
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4',
      '.aac': 'audio/aac',
      '.ogg': 'audio/ogg',
      '.flac': 'audio/flac',

      // Image
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.webp': 'image/webp',

      // Font
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
    };

    return contentTypes[ext] || 'application/octet-stream';
  }
}
