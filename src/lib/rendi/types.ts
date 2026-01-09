import type { Buffer } from 'node:buffer';

/**
 * Rendi.dev API Type Definitions
 * API Docs: https://docs.rendi.dev
 */

// ============================================================================
// File Storage API Types
// ============================================================================

export interface UploadFileRequest {
  file: Buffer | Blob;
  filename: string;
  content_type?: string;
}

export interface UploadFileResponse {
  file_id: string;
  storage_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
}

export interface GetFileResponse {
  file_id: string;
  storage_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
}

// ============================================================================
// FFmpeg Command API Types
// ============================================================================

export interface RunFFmpegCommandRequest {
  ffmpeg_command: string;
  input_files: Record<string, string>; // { placeholder: url/file_id }
  output_files: Record<string, string>; // { placeholder: filename }
}

export interface RunFFmpegCommandResponse {
  command_id: string;
  status: CommandStatus;
  created_at: string;
}

export type CommandStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT';

export interface GetCommandStatusResponse {
  command_id: string;
  status: CommandStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  output_files?: Record<string, OutputFile>;
  logs?: string;
}

export interface OutputFile {
  file_id: string;
  storage_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface RendiErrorResponse {
  error: string;
  message: string;
  status_code: number;
  details?: Record<string, unknown>;
}

export class RendiError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(message: string, statusCode: number, details?: Record<string, unknown>) {
    super(message);
    this.name = 'RendiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

// ============================================================================
// Asset Cache Types (for constants.ts)
// ============================================================================

export interface RendiAssets {
  bRollFileId: string;
  audioFileIds: Record<string, string>; // { filename: file_id }
}

// ============================================================================
// Helper Types
// ============================================================================

export interface PollOptions {
  maxAttempts?: number;
  pollInterval?: number; // milliseconds
}

export interface DownloadFileOptions {
  outputPath?: string;
}
