import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import ffmpeg from 'fluent-ffmpeg';
import { z } from 'zod';

import { DEFAULTS, MAIN_TEXT_PROMPT } from './constants';
import type { ReadCaptionResult } from './types';

interface GeneratedText {
  hook: string;
  caption: string;
  cta: string;
}

async function generateTextWithLLM(): Promise<GeneratedText> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY. Set it to run the OpenAI warmup call.');
  }

  const variationPrompt =
    MAIN_TEXT_PROMPT +
    `

IMPORTANT: You must generate a UNIQUE and DIFFERENT hook each time. Do NOT repeat the same hook. Vary the number, wording, and angle. Choose from the approved templates or create a new variation that matches the tone and style. Each generation should feel fresh and different from previous ones.

You MUST return a valid JSON object with the following structure:
{
  "hook": "Curiosity hook ending with (Read caption), no emojis",
  "caption": "Full long-form caption with emojis and numbered bullets",
  "cta": "Comment keyword CTA line"
}`;

  const schema = z.object({
    hook: z.string().min(1).describe('Curiosity hook ending with (Read caption), no emojis'),
    caption: z.string().min(1).describe('Full long-form caption with emojis and numbered bullets'),
    cta: z.string().min(1).describe('Comment keyword CTA line'),
  });

  // Try generateObject first (with retries)
  let lastError: Error | null = null;
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempting to generate object (attempt ${attempt}/${maxRetries})...`);
      const response = await generateObject({
        model: openai('gpt-4o-mini'),
        schema,
        prompt: variationPrompt,
        temperature: 0.9,
      });
      
      console.log('Successfully generated object:', response.object);
      return response.object;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`Attempt ${attempt} failed:`, lastError.message);
      
      if (attempt < maxRetries) {
        console.log(`Retrying in 1 second...`);
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  }

  // Fallback: Use generateText and manually parse JSON
  console.log('generateObject failed, falling back to generateText with manual JSON parsing...');
  
  try {
    const fallbackPrompt = variationPrompt + `\n\nReturn ONLY valid JSON. Do not include any markdown, code blocks, or additional text. Only the JSON object.`;
    
    const textResponse = await generateText({
      model: openai('gpt-4o-mini'),
      prompt: fallbackPrompt,
      temperature: 0.9,
      maxTokens: 2000,
    });

    let originalText = textResponse.text.trim();
    // Remove markdown code blocks if present
    originalText = originalText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    // Try multiple strategies to extract JSON
    let cleanText: string | null = null;
    
    // Strategy 1: Try to find a complete JSON object (non-greedy)
    const jsonMatch = originalText.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    } else {
      // Strategy 2: Extract between first { and last }
      const firstBrace = originalText.indexOf('{');
      const lastBrace = originalText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanText = originalText.substring(firstBrace, lastBrace + 1);
      } else {
        cleanText = originalText; // Fallback: use entire text
      }
    }

    console.log('Cleaned text for JSON parsing:', cleanText.substring(0, 200) + '...');
    console.log('Parsing JSON from text response...');
    
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanText);
    } catch (parseError) {
      // If first extraction failed, try extracting from original text again
      console.log('Initial parse failed, trying alternative extraction...');
      
      const firstBrace = originalText.indexOf('{');
      const lastBrace = originalText.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        const extracted = originalText.substring(firstBrace, lastBrace + 1);
        try {
          parsed = JSON.parse(extracted);
          cleanText = extracted; // Update cleanText for logging
        } catch (secondError) {
          throw new Error(
            `Failed to parse JSON after multiple extraction attempts. ` +
            `Original error: ${parseError instanceof Error ? parseError.message : String(parseError)}. ` +
            `Second error: ${secondError instanceof Error ? secondError.message : String(secondError)}. ` +
            `Text preview: ${originalText.substring(0, 500)}`
          );
        }
      } else {
        throw new Error(
          `Failed to find valid JSON structure. ` +
          `Error: ${parseError instanceof Error ? parseError.message : String(parseError)}. ` +
          `Text preview: ${originalText.substring(0, 500)}`
        );
      }
    }
    
    // Validate the parsed object matches our schema
    const validated = schema.parse(parsed);
    console.log('Successfully parsed and validated fallback response:', validated);
    return validated;
  } catch (fallbackError) {
    console.error('Fallback method also failed:', fallbackError);
    throw new Error(
      `Failed to generate content after ${maxRetries} retries and fallback attempt. ` +
      `Last error: ${lastError?.message}. Fallback error: ${fallbackError instanceof Error ? fallbackError.message : String(fallbackError)}`
    );
  }
}

function getRandomAudioFile(): string | null {
  const audioDir = DEFAULTS.audioFolder;

  if (!fs.existsSync(audioDir)) {
    console.log('Warning: audio directory not found, proceeding without background music');
    return null;
  }

  const audioExtensions = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'];
  const audioFiles = fs
    .readdirSync(audioDir)
    .filter((file) => audioExtensions.includes(path.extname(file).toLowerCase()))
    .map((file) => path.join(audioDir, file));

  if (audioFiles.length === 0) {
    console.log('Warning: no audio files found in audio directory');
    return null;
  }

  const randomAudio = audioFiles[Math.floor(Math.random() * audioFiles.length)];
  console.log(`Selected random audio: ${randomAudio}`);

  return randomAudio!;
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

function getVideoDuration(inputFile: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(inputFile, (err, metadata) => {
      if (err) {
        reject(new Error(`Failed to get video duration: ${err.message}`));
        return;
      }

      const duration = metadata.format.duration;
      if (!duration) {
        reject(new Error('Duration not found in video metadata'));
        return;
      }

      resolve(duration);
    });
  });
}

function extractSegment(
  inputFile: string,
  startTime: number,
  duration: number,
  outputFile: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputFile)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions(['-c:v libx264', '-c:a aac'])
      .output(outputFile)
      .on('end', () => resolve(outputFile))
      .on('error', (err) => reject(new Error(`Failed to extract segment: ${err.message}`)))
      .run();
  });
}

async function loopVideo(
  inputFile: string,
  targetDuration: number,
  outputFile: string,
  tempDir: string,
): Promise<string> {
  const duration = await getVideoDuration(inputFile);
  const loopsNeeded = Math.ceil(targetDuration / duration);

  const concatFile = path.join(tempDir, 'concat.txt');
  const concatContent = Array(loopsNeeded)
    .fill(`file '${inputFile.replace(/'/g, "'\\''")}'`)
    .join('\n');

  fs.writeFileSync(concatFile, concatContent);

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(concatFile)
      .inputOptions(['-f concat', '-safe 0'])
      .setDuration(targetDuration)
      .outputOptions(['-c:v libx264', '-c:a aac'])
      .output(outputFile)
      .on('end', () => resolve(outputFile))
      .on('error', (err) => reject(new Error(`Failed to loop video: ${err.message}`)))
      .run();
  });
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

  return lines.join('\n');
}

export async function generateReadCaptionReel(): Promise<ReadCaptionResult> {
  const inputFile = DEFAULTS.bRollPath;

  if (!fs.existsSync(inputFile)) {
    throw new Error(`Video file not found: ${inputFile}`);
  }

  const audioFile = getRandomAudioFile();

  console.log(`Getting video duration from ${inputFile}...`);
  const duration = await getVideoDuration(inputFile);
  console.log(`Video duration: ${duration.toFixed(2)} seconds`);

  let startTime = 0;
  if (duration < 7) {
    console.log('Video is shorter than 7 seconds, will loop to fill 7 seconds');
  } else {
    startTime = Math.random() * (duration - 7);
  }

  console.log(`Extracting segment starting at ${startTime.toFixed(2)} seconds...`);

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'video-reel-'));
  const tempSegment = path.join(tempDir, 'segment.mp4');
  const tempResized = path.join(tempDir, 'resized.mp4');

  try {
    if (duration < 7) {
      const tempFull = path.join(tempDir, 'full.mp4');
      await extractSegment(inputFile, 0, duration, tempFull);
      await loopVideo(tempFull, 7, tempSegment, tempDir);
    } else {
      await extractSegment(inputFile, startTime, 7, tempSegment);
    }

    console.log('Resizing to 9:16 aspect ratio (1080x1920)...');

    const targetHeight = 1920;

    await new Promise<void>((resolve, reject) => {
      ffmpeg(tempSegment)
        .outputOptions([
          '-vf',
          `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920`,
          '-c:v',
          'libx264',
          '-c:a',
          'aac',
        ])
        .output(tempResized)
        .on('end', () => resolve())
        .on('error', (err) => reject(new Error(`Failed to resize: ${err.message}`)))
        .run();
    });

    const outputFolder = createOutputFolder();
    const outputPath = path.resolve(path.join(outputFolder, 'reel.mp4'));
    
    // Ensure output directory exists
    if (!fs.existsSync(outputFolder)) {
      fs.mkdirSync(outputFolder, { recursive: true });
    }

    console.log('Generating text and captions...');

    const { hook, caption, cta } = await generateTextWithLLM();
    console.log('----------------Hook----------------:\n', hook);
    console.log('----------------Caption----------------:\n', caption);
    console.log('----------------CTA----------------:\n', cta);

    const mainText = hook;
    const subText = '(Read caption)';

    const mainLines = wrapText(mainText, 30).split('\n');
    const subLines = wrapText(subText, 25).split('\n');

    console.log('Main text will be displayed as:');
    mainLines.forEach((line, i) => console.log(`  Line ${i + 1}: ${line}`));

    const escapeForDrawtext = (text: string): string => {
      return text
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\\\'")
        .replace(/:/g, '\\:');
    };

    // Normalize font path for ffmpeg filters on Windows
    // Convert backslashes to forward slashes and escape the drive letter colon
    const normalizeFontPath = (fontPath: string): string => {
      let normalized = fontPath.replace(/\\/g, '/');
      // Escape the colon in Windows drive letters (e.g., C: -> C\\:)
      // Double escape needed because it goes through multiple layers
      // This is needed because : is used as a parameter separator in ffmpeg filters
      normalized = normalized.replace(/^([A-Za-z]):/, '$1\\\\:');
      return normalized;
    };

    const mainFontSize = 60;
    const mainLineSpacing = 20;
    const mainTotalHeight = mainLines.length * mainFontSize + (mainLines.length - 1) * mainLineSpacing;
    const mainStartY = targetHeight / 2 - mainTotalHeight / 2 - 100;

    const subFontSize = 40;
    const subLineSpacing = 15;
    const subStartY = mainStartY + mainTotalHeight + 80;

    const drawtextFilters: string[] = [];

    const normalizedFontPath = normalizeFontPath(DEFAULTS.fontPath);
    
    mainLines.forEach((line, index) => {
      const yPos = mainStartY + index * (mainFontSize + mainLineSpacing);
      const escapedLine = escapeForDrawtext(line);
      drawtextFilters.push(
        `drawtext=fontfile=${normalizedFontPath}:` +
          `text='${escapedLine}':` +
          `fontcolor=white:` +
          `fontsize=${mainFontSize}:` +
          `x=(w-text_w)/2:` +
          `y=${yPos}:` +
          `borderw=3:` +
          `bordercolor=black`,
      );
    });

    subLines.forEach((line, index) => {
      const yPos = subStartY + index * (subFontSize + subLineSpacing);
      const escapedLine = escapeForDrawtext(line);
      drawtextFilters.push(
        `drawtext=fontfile=${normalizedFontPath}:` +
          `text='${escapedLine}':` +
          `fontcolor=white:` +
          `fontsize=${subFontSize}:` +
          `x=(w-text_w)/2:` +
          `y=${yPos}:` +
          `enable='gte(t,4)':` +
          `borderw=2:` +
          `bordercolor=black`,
      );
    });

    console.log(`Exporting to ${outputPath}...`);

    // Ensure output file doesn't exist (remove if it does)
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }

    const ffmpegCommand = ffmpeg(tempResized);

    if (audioFile) {
      console.log('Adding background audio...');
      ffmpegCommand.input(audioFile);
    }

    const outputOptions: string[] = [
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-b:v',
      '8000k',
      '-r',
      '24',
    ];

    if (audioFile) {
      // Combine video and audio filters into a single filter_complex
      const videoFilter = drawtextFilters.join(',');
      const filterComplex = `[0:v]${videoFilter}[v];[0:a][1:a]amix=inputs=2:duration=shortest:dropout_transition=2[a]`;
      console.log('Using filter_complex:', filterComplex);
      outputOptions.push(
        '-filter_complex',
        filterComplex,
        '-map',
        '[v]',
        '-map',
        '[a]',
        '-c:a',
        'aac',
        '-b:a',
        '192k',
      );
    } else {
      // No audio, use simple video filter
      const videoFilter = drawtextFilters.join(',');
      console.log('Using video filter:', videoFilter);
      outputOptions.push(
        '-vf',
        videoFilter,
        '-c:a',
        'aac',
      );
    }

    await new Promise<string>((resolve, reject) => {
      ffmpegCommand
        .outputOptions(outputOptions)
        .output(outputPath)
        .on('end', () => {
          console.log(`\nVideo exported successfully to: ${outputPath}`);
          resolve(outputPath);
        })
        .on('error', (err) => {
          console.error('FFmpeg error details:', err);
          console.error('Output path:', outputPath);
          console.error('Output options:', outputOptions);
          reject(new Error(`Failed to add captions: ${err.message}`));
        })
        .run();
    });

    const captionContent = `${hook}\n\n${caption}\n\n${cta}`;
    const captionPath = path.join(outputFolder, 'caption.txt');
    await fsPromises.writeFile(captionPath, captionContent);
    console.log(`Caption saved: ${captionPath}`);

    return {
      outputFolder,
      videoPath: outputPath,
      captionPath,
      hook,
      caption,
      cta,
    };
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

