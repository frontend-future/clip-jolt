/* eslint-disable no-console */
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';

import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';

import { Env } from '@/libs/Env';

import { createRendiClient } from '../rendi/client';
import { DEFAULTS, MAIN_TEXT_PROMPT, RENDI_CONFIG } from './constants';
import type { ReadCaptionResult } from './types';

type GeneratedText = {
  hook: string;
  caption: string;
  cta: string;
};

async function generateTextWithLLM(): Promise<GeneratedText> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY. Set it to run the OpenAI warmup call.');
  }

  const variationPrompt
    = `${MAIN_TEXT_PROMPT
    }

IMPORTANT: You must generate a UNIQUE and DIFFERENT hook each time. Do NOT repeat the same hook. Vary the number, wording, and angle. Choose from the approved templates or create a new variation that matches the tone and style. Each generation should feel fresh and different from previous ones.`;

  const response = await generateObject({
    model: openai('gpt-4o-mini'),
    schema: z.object({
      hook: z.string().describe('Curiosity hook ending with (Read caption), no emojis'),
      caption: z.string().describe('Full long-form caption with emojis and numbered bullets'),
      cta: z.string().describe('Comment keyword CTA line'),
    }),
    prompt: variationPrompt,
    temperature: 0.9,
  });
  return response.object;
}

function getRandomAudioUrl(): string | null {
  const audioFiles = [...RENDI_CONFIG.audioFiles];

  if (audioFiles.length === 0) {
    console.log('Warning: no audio files configured, proceeding without background music');
    return null;
  }

  const randomAudioId = audioFiles[Math.floor(Math.random() * audioFiles.length)];
  const audioUrl = `${RENDI_CONFIG.audioFolderUrl}${randomAudioId}`;
  console.log(`Selected random audio: ${audioUrl}`);

  return audioUrl;
}

function createOutputFolder(): string {
  const timestamp = new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
  const folderName = `caption_${timestamp}`;
  const fullPath = path.join(DEFAULTS.outputDir, folderName);

  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
  }

  return fullPath;
}

function wrapText(text: string, maxCharsPerLine = 30): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;

    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines.join('\\n');
}

async function processVideoWithRendi(
  hook: string,
  audioUrl: string | null,
  outputPath: string,
): Promise<void> {
  console.log('\n🎬 Processing video with Rendi...');

  const rendiClient = createRendiClient(Env.RENDI_API_KEY);

  // Step 1: Extract and resize segment to 1080x1920
  console.log('\n✂️  Extracting and resizing video segment...');

  // Pick a random start time (assuming bRoll is at least 30s long)
  const randomStartTime = Math.floor(Math.random() * 30);
  const duration = 7;

  const resizeCommand
    = `-ss ${randomStartTime} -t ${duration} -i {{in_broll}} `
      + `-vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" `
      + `-c:v libx264 -c:a aac -preset medium -crf 23 -pix_fmt yuv420p {{out_resized}}`;

  const resizeResult = await rendiClient.runFFmpegCommand({
    ffmpeg_command: resizeCommand,
    input_files: {
      in_broll: RENDI_CONFIG.bRollUrl,
    },
    output_files: {
      out_resized: 'resized.mp4',
    },
  });

  console.log(`Command submitted: ${resizeResult.command_id}`);
  const resizeOutput = await rendiClient.pollCommandStatus(resizeResult.command_id);
  const resizedVideoUrl = resizeOutput.out_resized!.storage_url;
  console.log(`✅ Video resized: ${resizedVideoUrl}`);

  // Step 2: Add text overlays and audio
  console.log('\n🎨 Adding text overlays and audio...');

  const mainText = hook;
  const subText = '(Read caption)';

  const escapeForDrawtext = (text: string): string => {
    return text.replace(/\\/g, '\\\\\\\\').replace(/'/g, '\\\\\\\\\'').replace(/:/g, '\\\\:');
  };

  const mainLines = wrapText(mainText, 30).split('\\n');
  const subLines = wrapText(subText, 25).split('\\n');

  const targetHeight = 1920;
  const mainFontSize = 60;
  const mainLineSpacing = 20;
  const mainTotalHeight = mainLines.length * mainFontSize + (mainLines.length - 1) * mainLineSpacing;
  const mainStartY = targetHeight / 2 - mainTotalHeight / 2 - 100;

  const subFontSize = 40;
  const subLineSpacing = 15;
  const subStartY = mainStartY + mainTotalHeight + 80;

  const drawtextFilters: string[] = [];

  // Use placeholder for font file - Rendi will download from URL
  const fontPlaceholder = '{{in_font}}';

  mainLines.forEach((line, index) => {
    const yPos = mainStartY + index * (mainFontSize + mainLineSpacing);
    const escapedLine = escapeForDrawtext(line);
    drawtextFilters.push(
      `drawtext=fontfile=${fontPlaceholder}:`
      + `text='${escapedLine}':`
      + `fontcolor=white:`
      + `fontsize=${mainFontSize}:`
      + `x=(w-text_w)/2:`
      + `y=${yPos}:`
      + `borderw=3:`
      + `bordercolor=black`,
    );
  });

  subLines.forEach((line, index) => {
    const yPos = subStartY + index * (subFontSize + subLineSpacing);
    const escapedLine = escapeForDrawtext(line);
    drawtextFilters.push(
      `drawtext=fontfile=${fontPlaceholder}:`
      + `text='${escapedLine}':`
      + `fontcolor=white:`
      + `fontsize=${subFontSize}:`
      + `x=(w-text_w)/2:`
      + `y=${yPos}:`
      + `enable='gte(t,4)':`
      + `borderw=2:`
      + `bordercolor=black`,
    );
  });

  // Build FFmpeg command with optional audio
  let overlayCommand: string;
  let inputFiles: Record<string, string>;
  let audioFilter = '';

  if (audioUrl) {
    inputFiles = {
      in_video: resizedVideoUrl,
      in_audio: audioUrl,
      in_font: RENDI_CONFIG.fontUrl,
    };

    audioFilter
      = ` -filter_complex "[0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[aout]" `
        + `-map "[aout]"`;

    overlayCommand
      = `-i {{in_video}} -i {{in_audio}} `
        + `-vf "${drawtextFilters.join(',')}" ${
          audioFilter
        } -map 0:v -c:v libx264 -c:a aac -b:a 192k -preset medium -b:v 8000k -r 24 -pix_fmt yuv420p {{out_final}}`;
  } else {
    inputFiles = {
      in_video: resizedVideoUrl,
      in_font: RENDI_CONFIG.fontUrl,
    };

    overlayCommand
      = `-i {{in_video}} `
        + `-vf "${drawtextFilters.join(',')}" `
        + `-c:v libx264 -c:a aac -preset medium -b:v 8000k -r 24 -pix_fmt yuv420p {{out_final}}`;
  }

  const overlayResult = await rendiClient.runFFmpegCommand({
    ffmpeg_command: overlayCommand,
    input_files: inputFiles,
    output_files: {
      out_final: 'reel.mp4',
    },
  });

  console.log(`Command submitted: ${overlayResult.command_id}`);
  const overlayOutput = await rendiClient.pollCommandStatus(overlayResult.command_id);
  const finalVideoUrl = overlayOutput.out_final!.storage_url;
  console.log(`✅ Final video created: ${finalVideoUrl}`);

  // Step 3: Download final video
  console.log('\n📥 Downloading final video...');
  await rendiClient.downloadFileByUrl(finalVideoUrl, outputPath);
  console.log(`✅ Video saved: ${outputPath}`);
}

export async function generateReadCaptionReel(): Promise<ReadCaptionResult> {
  const audioUrl = getRandomAudioUrl();

  console.log('Generating text and captions...');

  const { hook, caption, cta } = await generateTextWithLLM();
  console.log('----------------Hook----------------:\n', hook);
  console.log('----------------Caption----------------:\n', caption);
  console.log('----------------CTA----------------:\n', cta);

  const outputFolder = createOutputFolder();
  const outputPath = path.join(outputFolder, 'reel.mp4');

  await processVideoWithRendi(hook, audioUrl, outputPath);

  const captionContent = `${hook}\n\n${caption}\n\n${cta}`;
  const captionPath = path.join(outputFolder, 'caption.txt');
  await fsPromises.writeFile(captionPath, captionContent);
  console.log(`Caption saved: ${captionPath}`);

  console.log(`\n${'='.repeat(60)}`);
  console.log('ALL DONE!');
  console.log('='.repeat(60));
  console.log(`Folder: ${outputFolder}`);
  console.log(`Video: ${outputPath}`);
  console.log(`Caption: ${captionPath}`);

  return {
    outputFolder,
    videoPath: outputPath,
    captionPath,
    hook,
    caption,
    cta,
  };
}
