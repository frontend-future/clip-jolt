/* eslint-disable no-console */
import { Buffer } from 'node:buffer';
import fs from 'node:fs/promises';

import type {
  DownloadFileOptions,
  GetCommandStatusResponse,
  OutputFile,
  PollOptions,
  RendiError,
  RendiErrorResponse,
  RunFFmpegCommandRequest,
  RunFFmpegCommandResponse,
  UploadFileResponse,
} from './types';

const RENDI_API_BASE = 'https://api.rendi.dev';

export class RendiClient {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('Rendi API key is required');
    }
    this.apiKey = apiKey;
  }

  /**
   * Upload a file to Rendi storage (for small files < 10MB)
   * For larger files, use storeFileByUrl instead
   */
  async uploadFile(file: Buffer, filename: string, contentType?: string): Promise<UploadFileResponse> {
    const formData = new FormData();
    const blob = new Blob([file], { type: contentType || 'application/octet-stream' });
    formData.append('file', blob, filename);

    const response = await fetch(`${RENDI_API_BASE}/v1/files/upload`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      console.error('Upload failed:', response.status, text);
      try {
        const error = JSON.parse(text) as RendiErrorResponse;
        throw this.createError(error);
      } catch {
        throw new Error(`Upload failed: ${response.status} ${text.substring(0, 200)}`);
      }
    }

    return response.json() as Promise<UploadFileResponse>;
  }

  /**
   * Store a file in Rendi by providing a publicly accessible URL
   * This is the recommended method for large files
   */
  async storeFileByUrl(fileUrl: string): Promise<{ file_id: string }> {
    const response = await fetch(`${RENDI_API_BASE}/v1/files/store-file`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ file_url: fileUrl }),
    });

    if (!response.ok) {
      const error = (await response.json()) as RendiErrorResponse;
      throw this.createError(error);
    }

    return response.json() as Promise<{ file_id: string }>;
  }

  /**
   * Run an FFmpeg command on Rendi servers
   */
  async runFFmpegCommand(request: RunFFmpegCommandRequest): Promise<RunFFmpegCommandResponse> {
    const response = await fetch(`${RENDI_API_BASE}/v1/run-ffmpeg-command`, {
      method: 'POST',
      headers: {
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = (await response.json()) as RendiErrorResponse;
      throw this.createError(error);
    }

    return response.json() as Promise<RunFFmpegCommandResponse>;
  }

  /**
   * Get the status of a running FFmpeg command
   */
  async getCommandStatus(commandId: string): Promise<GetCommandStatusResponse> {
    const response = await fetch(`${RENDI_API_BASE}/v1/commands/${commandId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as RendiErrorResponse;
      throw this.createError(error);
    }

    return response.json() as Promise<GetCommandStatusResponse>;
  }

  /**
   * Poll a command until it completes (SUCCESS or FAILED)
   */
  async pollCommandStatus(
    commandId: string,
    options: PollOptions = {},
  ): Promise<Record<string, OutputFile>> {
    const maxAttempts = options.maxAttempts || 60; // 60 * 3s = 3 minutes
    const pollInterval = options.pollInterval || 3000; // 3 seconds

    console.log(`Polling command ${commandId}...`);

    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.getCommandStatus(commandId);

      console.log(`Attempt ${i + 1}/${maxAttempts}: ${status.status}`);

      if (status.status === 'SUCCESS') {
        if (!status.output_files) {
          throw new Error('Command succeeded but no output files returned');
        }
        console.log(`Command ${commandId} completed successfully`);
        return status.output_files;
      }

      if (status.status === 'FAILED' || status.status === 'TIMEOUT') {
        const errorMsg = status.error_message || 'FFmpeg command failed';
        const logs = status.logs ? `\n\nLogs:\n${status.logs}` : '';
        throw new Error(`${errorMsg}${logs}`);
      }

      // Still processing, wait before next poll
      await new Promise((resolve) => setTimeout(resolve, pollInterval));
    }

    throw new Error(`Command ${commandId} timeout after ${maxAttempts * pollInterval}ms`);
  }

  /**
   * Download a file from Rendi storage
   */
  async downloadFile(fileId: string, options: DownloadFileOptions = {}): Promise<Buffer> {
    const response = await fetch(`${RENDI_API_BASE}/v1/files/${fileId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const error = (await response.json()) as RendiErrorResponse;
      throw this.createError(error);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // If outputPath is provided, save to disk
    if (options.outputPath) {
      await fs.writeFile(options.outputPath, buffer);
      console.log(`File downloaded to: ${options.outputPath}`);
    }

    return buffer;
  }

  /**
   * Download a file by its storage URL
   */
  async downloadFileByUrl(storageUrl: string, outputPath?: string): Promise<Buffer> {
    const response = await fetch(storageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download file from ${storageUrl}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (outputPath) {
      await fs.writeFile(outputPath, buffer);
      console.log(`File downloaded to: ${outputPath}`);
    }

    return buffer;
  }

  /**
   * Create a typed error from Rendi API error response
   */
  private createError(error: RendiErrorResponse): RendiError {
    const err = new Error(error.message || error.error) as RendiError;
    err.name = 'RendiError';
    err.statusCode = error.status_code;
    err.details = error.details;
    return err;
  }
}

/**
 * Create a singleton Rendi client instance
 */
export function createRendiClient(apiKey: string): RendiClient {
  return new RendiClient(apiKey);
}
