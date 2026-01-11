import path from 'node:path';

import type { Logger } from '@/libs/Logger';

import type { RendiInputFiles, RendiOutputFiles } from './RendiService';
import { RendiService } from './RendiService';

export interface RendiVideoOperationsConfig {
  apiKey: string;
  logger?: Logger;
}

/**
 * High-level video operations using Rendi API
 * Replaces local ffmpeg operations with cloud-based processing
 */
export class RendiVideoOperations {
  private rendiService: RendiService;

  private logger?: Logger;

  constructor(config: RendiVideoOperationsConfig) {
    this.rendiService = new RendiService(
      {
        apiKey: config.apiKey,
      },
      config.logger,
    );
    this.logger = config.logger;
  }

  /**
   * Extract a random segment from a video
   * Replaces: extractRandomVideoSegment() from generateCodingChallengeReel.ts
   *
   * @param inputVideoUrl - Public URL of input video
   * @param outputPath - Local path where output should be saved
   * @param duration - Duration of segment in seconds
   * @param startTime - Optional start time (if not provided, will be random)
   */
  async extractVideoSegment(
    inputVideoUrl: string,
    outputPath: string,
    duration: number,
    startTime?: number,
  ): Promise<void> {
    this.logger?.info('Extracting video segment via Rendi', {
      inputVideoUrl,
      duration,
      startTime,
    });

    const outputFileName = path.basename(outputPath);

    // Build FFmpeg command
    // Note: For random start time, you'd need to know video duration first
    // For now, we'll require startTime to be provided
    if (startTime === undefined) {
      throw new Error(
        'startTime must be provided when using Rendi. '
        + 'To extract random segment, first get video duration, then calculate random start time.',
      );
    }

    const ffmpegCommand
      = `-i {{in_1}} -ss ${startTime} -t ${duration} `
      + '-c:v libx264 -pix_fmt yuv420p '
      + '-vf scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920 '
      + '-preset medium -crf 23 {{out_1}}';

    const result = await this.rendiService.submitAndWait({
      ffmpeg_command: ffmpegCommand,
      input_files: {
        in_1: inputVideoUrl,
      },
      output_files: {
        out_1: outputFileName,
      },
      vcpu_count: 4,
      max_command_run_seconds: 300,
    });

    if (!result.output_files?.out_1) {
      throw new Error('No output file returned from Rendi');
    }

    // Download the result
    await this.rendiService.downloadFile(
      result.output_files.out_1.storage_url,
      outputPath,
    );

    this.logger?.info('Video segment extracted successfully', {
      outputPath,
      processingSeconds: result.total_processing_seconds,
    });
  }

  /**
   * Overlay an image on video with audio
   * Replaces: overlayCodeOnVideoWithAudio() from generateCodingChallengeReel.ts
   */
  async overlayImageOnVideoWithAudio(
    backgroundVideoUrl: string,
    overlayImageUrl: string,
    audioUrl: string,
    outputPath: string,
    duration: number,
    levelText: string,
    levelY = 840,
    levelAppearTime = 2,
  ): Promise<void> {
    this.logger?.info('Overlaying image on video with audio via Rendi', {
      backgroundVideoUrl,
      overlayImageUrl,
      audioUrl,
      duration,
    });

    const outputFileName = path.basename(outputPath);

    // Build complex FFmpeg command with overlay and drawtext
    const ffmpegCommand
      = '-i {{in_video}} -i {{in_image}} -i {{in_audio}} '
      + '-filter_complex "'
      + '[1:v]scale=1080:1920[overlay];'
      + '[0:v][overlay]overlay=0:0[video_base];'
      + `[video_base]drawtext=text='LEVEL\\\\: ${levelText}':`
      + 'fontfile=/System/Library/Fonts/Supplemental/Arial\\\\ Bold.ttf:'
      + 'fontsize=42:fontcolor=#818cf8:borderw=2:bordercolor=black:'
      + `x=(w-text_w)/2:y=${levelY}:`
      + `enable='gte(t,${levelAppearTime})':`
      + `alpha='if(lt(t,${levelAppearTime}),0,if(lt(t,${levelAppearTime + 0.3}),(t-${levelAppearTime})/0.3,1))'`
      + '[video];'
      + `[2:a]atrim=0:${duration},asetpts=PTS-STARTPTS[audio]" `
      + '-map [video] -map [audio] '
      + '-c:v libx264 -c:a aac -b:a 192k '
      + `-t ${duration} -pix_fmt yuv420p -preset medium -crf 23 -shortest `
      + '{{out_1}}';

    const result = await this.rendiService.submitAndWait({
      ffmpeg_command: ffmpegCommand,
      input_files: {
        in_video: backgroundVideoUrl,
        in_image: overlayImageUrl,
        in_audio: audioUrl,
      },
      output_files: {
        out_1: outputFileName,
      },
      vcpu_count: 4,
      max_command_run_seconds: 300,
    });

    if (!result.output_files?.out_1) {
      throw new Error('No output file returned from Rendi');
    }

    await this.rendiService.downloadFile(
      result.output_files.out_1.storage_url,
      outputPath,
    );

    this.logger?.info('Image overlay completed successfully', {
      outputPath,
      processingSeconds: result.total_processing_seconds,
    });
  }

  /**
   * Resize and crop video to 1080x1920 (portrait)
   * Replaces: resize operation from generateReadCaptionReel.ts
   */
  async resizeAndCropVideo(
    inputVideoUrl: string,
    outputPath: string,
  ): Promise<void> {
    this.logger?.info('Resizing and cropping video via Rendi', {
      inputVideoUrl,
    });

    const outputFileName = path.basename(outputPath);

    const ffmpegCommand
      = '-i {{in_1}} '
      + '-vf scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920 '
      + '-c:v libx264 -c:a aac {{out_1}}';

    const result = await this.rendiService.submitAndWait({
      ffmpeg_command: ffmpegCommand,
      input_files: {
        in_1: inputVideoUrl,
      },
      output_files: {
        out_1: outputFileName,
      },
      vcpu_count: 4,
      max_command_run_seconds: 300,
    });

    if (!result.output_files?.out_1) {
      throw new Error('No output file returned from Rendi');
    }

    await this.rendiService.downloadFile(
      result.output_files.out_1.storage_url,
      outputPath,
    );

    this.logger?.info('Video resized successfully', { outputPath });
  }

  /**
   * Add text overlays to video
   * Replaces: text overlay operation from generateReadCaptionReel.ts
   */
  async addTextOverlays(
    inputVideoUrl: string,
    outputPath: string,
    mainText: string,
    subText: string,
    fontPath: string,
    audioUrl?: string,
  ): Promise<void> {
    this.logger?.info('Adding text overlays via Rendi', {
      inputVideoUrl,
      mainText,
      subText,
    });

    const outputFileName = path.basename(outputPath);

    // Escape text for drawtext filter
    const escapeForDrawtext = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\\\\\')
        .replace(/'/g, '\\\\\\\\\\\\\'')
        .replace(/:/g, '\\\\:');
    };

    const escapedMainText = escapeForDrawtext(mainText);
    const escapedSubText = escapeForDrawtext(subText);

    // Build drawtext filters
    const mainFontSize = 60;
    const mainY = 860; // Approximate center for 1920 height
    const subFontSize = 40;
    const subY = mainY + 100;

    const drawtextFilters
      = `drawtext=fontfile=${fontPath}:text='${escapedMainText}':`
      + `fontcolor=white:fontsize=${mainFontSize}:x=(w-text_w)/2:y=${mainY}:borderw=3:bordercolor=black,`
      + `drawtext=fontfile=${fontPath}:text='${escapedSubText}':`
      + `fontcolor=white:fontsize=${subFontSize}:x=(w-text_w)/2:y=${subY}:enable='gte(t,4)':borderw=2:bordercolor=black`;

    let ffmpegCommand: string;
    const inputFiles: RendiInputFiles = {
      in_video: inputVideoUrl,
    };

    if (audioUrl) {
      // With audio mixing
      ffmpegCommand
        = '-i {{in_video}} -i {{in_audio}} '
        + `-vf "${drawtextFilters}" `
        + '-filter_complex [0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[aout] '
        + '-map 0:v -map [aout] '
        + '-c:v libx264 -preset medium -b:v 8000k -r 24 -c:a aac -b:a 192k {{out_1}}';
      inputFiles.in_audio = audioUrl;
    } else {
      // Without audio mixing
      ffmpegCommand
        = '-i {{in_video}} '
        + `-vf "${drawtextFilters}" `
        + '-c:v libx264 -preset medium -b:v 8000k -r 24 -c:a aac {{out_1}}';
    }

    const result = await this.rendiService.submitAndWait({
      ffmpeg_command: ffmpegCommand,
      input_files: inputFiles,
      output_files: {
        out_1: outputFileName,
      },
      vcpu_count: 4,
      max_command_run_seconds: 300,
    });

    if (!result.output_files?.out_1) {
      throw new Error('No output file returned from Rendi');
    }

    await this.rendiService.downloadFile(
      result.output_files.out_1.storage_url,
      outputPath,
    );

    this.logger?.info('Text overlays added successfully', { outputPath });
  }

  /**
   * Get video duration using ffprobe
   * Note: This still needs to be done locally or via Rendi's ffprobe endpoint
   */
  async getVideoDuration(videoUrl: string): Promise<number> {
    // TODO: Implement using Rendi's ffprobe endpoint if available
    // For now, this would need to be done locally or via another method
    throw new Error(
      'getVideoDuration not yet implemented for Rendi. '
      + 'Consider using local ffprobe or Rendi ffprobe endpoint.',
    );
  }
}
