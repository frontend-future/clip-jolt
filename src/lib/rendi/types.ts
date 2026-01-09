import type { Buffer } from 'node:buffer';

/**
 * Rendi.dev API Type Definitions
 * API Docs: https://docs.rendi.dev
 */

// ============================================================================
// File Storage API Types
// ============================================================================

export type UploadFileRequest = {
  file: Buffer | Blob;
  filename: string;
  content_type?: string;
};

export type UploadFileResponse = {
  file_id: string;
  storage_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
};

export type GetFileResponse = {
  file_id: string;
  storage_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
  created_at: string;
};

// ============================================================================
// FFmpeg Command API Types
// ============================================================================

export type RunFFmpegCommandRequest = {
  ffmpeg_command: string;
  input_files: Record<string, string>; // { placeholder: url/file_id }
  output_files: Record<string, string>; // { placeholder: filename }
};

export type RunFFmpegCommandResponse = {
  command_id: string;
  status: CommandStatus;
  created_at: string;
};

export type CommandStatus =
  | 'QUEUED'
  | 'PROCESSING'
  | 'SUCCESS'
  | 'FAILED'
  | 'TIMEOUT';

export type GetCommandStatusResponse = {
  command_id: string;
  status: CommandStatus;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  error_message?: string;
  output_files?: Record<string, OutputFile>;
  logs?: string;
};

export type OutputFile = {
  file_id: string;
  storage_url: string;
  filename: string;
  size_bytes: number;
  content_type: string;
};

// ============================================================================
// Error Types
// ============================================================================

export type RendiErrorResponse = {
  error: string;
  message: string;
  status_code: number;
  details?: Record<string, unknown>;
};

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

export type RendiAssets = {
  bRollFileId: string;
  audioFileIds: Record<string, string>; // { filename: file_id }
};

// ============================================================================
// Helper Types
// ============================================================================

export type PollOptions = {
  maxAttempts?: number;
  pollInterval?: number; // milliseconds
};

export type DownloadFileOptions = {
  outputPath?: string;
};
