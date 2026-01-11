// Logger type removed - using optional logger parameter

export interface RendiConfig {
  apiKey: string;
  baseUrl?: string;
  maxPollAttempts?: number;
  pollIntervalMs?: number;
}

export interface RendiInputFiles {
  [key: string]: string; // e.g., { in_1: 'https://...' }
}

export interface RendiOutputFiles {
  [key: string]: string; // e.g., { out_1: 'output.mp4' }
}

export interface RendiSubmitRequest {
  ffmpeg_command: string;
  input_files: RendiInputFiles;
  output_files: RendiOutputFiles;
  vcpu_count?: number;
  max_command_run_seconds?: number;
}

export interface RendiSubmitResponse {
  command_id: string;
}

export type RendiCommandStatus = 'QUEUED' | 'PROCESSING' | 'SUCCESS' | 'FAILED';

export type RendiProcessingStage =
  | 'DOWNLOADING'
  | 'PREPARING_INPUT_FILES'
  | 'FFMPEG_PROCESSING'
  | 'UPLOADING';

export interface RendiOutputFileInfo {
  storage_url: string;
  file_id: string;
  size_mbytes: number;
  duration?: number;
  codec?: string;
  width?: number;
  height?: number;
  file_type?: string;
  mime_type?: string;
}

export interface RendiPollResponse {
  command_id: string;
  status: RendiCommandStatus;
  command_type: string;
  processing_stage?: RendiProcessingStage;
  total_processing_seconds?: number;
  ffmpeg_command_run_seconds?: number;
  vcpu_count?: number;
  output_files?: {
    [key: string]: RendiOutputFileInfo;
  };
  error_status?: string | null;
  error_message?: string | null;
  original_request?: RendiSubmitRequest;
}

export class RendiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public errorStatus?: string,
  ) {
    super(message);
    this.name = 'RendiError';
  }
}

export class RendiService {
  private readonly apiKey: string;

  private readonly baseUrl: string;

  private readonly maxPollAttempts: number;

  private readonly pollIntervalMs: number;

  private logger?: any;

  constructor(config: RendiConfig, logger?: any) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.rendi.dev/v1';
    this.maxPollAttempts = config.maxPollAttempts || 120; // 120 attempts * 5s = 10 minutes max
    this.pollIntervalMs = config.pollIntervalMs || 5000; // Poll every 5 seconds
    this.logger = logger;
  }

  /**
   * Submit an FFmpeg command to Rendi for processing
   */
  async submitCommand(request: RendiSubmitRequest): Promise<string> {
    this.logger?.info('Submitting FFmpeg command to Rendi', {
      command: request.ffmpeg_command,
      inputFiles: Object.keys(request.input_files),
      outputFiles: Object.keys(request.output_files),
    });

    const response = await fetch(`${this.baseUrl}/run-ffmpeg-command`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new RendiError(
        `Failed to submit command: ${errorText}`,
        response.status,
      );
    }

    const data = (await response.json()) as RendiSubmitResponse;
    this.logger?.info('Command submitted successfully', {
      commandId: data.command_id,
    });

    return data.command_id;
  }

  /**
   * Poll for command status
   */
  async pollCommand(commandId: string): Promise<RendiPollResponse> {
    const response = await fetch(`${this.baseUrl}/commands/${commandId}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': this.apiKey,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new RendiError(
        `Failed to poll command: ${errorText}`,
        response.status,
      );
    }

    return (await response.json()) as RendiPollResponse;
  }

  /**
   * Submit command and wait for completion with polling
   */
  async submitAndWait(request: RendiSubmitRequest): Promise<RendiPollResponse> {
    const commandId = await this.submitCommand(request);

    this.logger?.info('Waiting for command to complete', {
      commandId,
      maxAttempts: this.maxPollAttempts,
      pollInterval: this.pollIntervalMs,
    });

    let attempts = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      attempts += 1;

      if (attempts > this.maxPollAttempts) {
        throw new RendiError(
          `Command polling timeout after ${this.maxPollAttempts} attempts`,
        );
      }

      // Wait before polling
      await this.sleep(this.pollIntervalMs);

      const status = await this.pollCommand(commandId);

      this.logger?.info('Command status update', {
        commandId,
        status: status.status,
        stage: status.processing_stage,
        attempt: attempts,
      });

      if (status.status === 'SUCCESS') {
        this.logger?.info('Command completed successfully', {
          commandId,
          processingSeconds: status.total_processing_seconds,
          ffmpegSeconds: status.ffmpeg_command_run_seconds,
        });
        return status;
      }

      if (status.status === 'FAILED') {
        throw new RendiError(
          `Command failed: ${status.error_message || 'Unknown error'}`,
          undefined,
          status.error_status || undefined,
        );
      }

      // Continue polling if QUEUED or PROCESSING
    }
  }

  /**
   * Download output file from Rendi storage
   */
  async downloadFile(url: string, outputPath: string): Promise<void> {
    this.logger?.info('Downloading file from Rendi', { url, outputPath });

    const response = await fetch(url);

    if (!response.ok) {
      throw new RendiError(`Failed to download file: ${response.statusText}`);
    }

    const fs = await import('node:fs/promises');
    const buffer = await response.arrayBuffer();
    await fs.writeFile(outputPath, Buffer.from(buffer));

    this.logger?.info('File downloaded successfully', { outputPath });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
