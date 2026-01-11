import fs from 'node:fs/promises';
import path from 'node:path';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import ffmpeg from 'fluent-ffmpeg';
import puppeteer, { type Browser } from 'puppeteer';
import { getHighlighter } from 'shiki';

import { FileUploadHelper, RendiVideoOperations } from '@/lib/rendi';

import { CODING_CHALLENGE_PROMPT, DEFAULTS } from './constants';
import type { CodingChallengeResult, CodingSnippet } from './types';

function getTimestampedFolder(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `coding_${year}${month}${day}_${hours}${minutes}${seconds}`;
}

async function generateSnippetWithAI(): Promise<CodingSnippet> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY');
  }

  const response = await generateText({
    model: openai('gpt-4o'),
    prompt: CODING_CHALLENGE_PROMPT,
    maxTokens: 500,
    temperature: 0.9,
  });

  let cleanText = response.text.trim();
  cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

  const snippet = JSON.parse(cleanText) as CodingSnippet;
  return snippet;
}

async function getVideoDuration(videoPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(videoPath, (err, metadata) => {
      if (err) {
        reject(err);
      } else {
        resolve(metadata.format.duration || 0);
      }
    });
  });
}

async function getRandomAudioFile(audioFolder: string): Promise<string> {
  const files = await fs.readdir(audioFolder);
  const audioFiles = files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.m4a', '.aac'].includes(ext);
  });

  if (audioFiles.length === 0) {
    throw new Error(`No audio files found in ${audioFolder}`);
  }

  const randomFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];
  return path.join(audioFolder, randomFile);
}

async function renderSnippet(
  code: string,
  outputPath: string,
  browser: Browser,
): Promise<void> {
  const highlighter = await getHighlighter({
    themes: ['github-dark'],
    langs: ['javascript', 'typescript', 'python', 'java', 'cpp'],
  });

  const html = highlighter.codeToHtml(code, {
    lang: 'javascript',
    theme: 'github-dark',
  });

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        * { margin: 0; padding: 0; }
        body {
          width: 1080px;
          height: 1920px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          font-family: 'Courier New', monospace;
        }
        pre {
          font-size: 32px !important;
          line-height: 1.6 !important;
          padding: 40px !important;
          border-radius: 20px;
          max-width: 1000px;
          overflow: hidden;
        }
        code {
          font-size: 32px !important;
          line-height: 1.6 !important;
        }
      </style>
    </head>
    <body>${html}</body>
    </html>
  `;

  const page = await browser.newPage();
  await page.setViewport({ width: 1080, height: 1920 });
  await page.setContent(fullHtml);
  await page.screenshot({ path: outputPath, omitBackground: true });
  await page.close();
}

/**
 * Cloud-based version of generateCodingChallengeReel
 * Uses Rendi for video processing instead of local FFmpeg
 */
export async function generateCodingChallengeReelCloud(): Promise<CodingChallengeResult> {
  // Validate environment variables
  if (!process.env.RENDI_API_KEY) {
    throw new Error('Missing RENDI_API_KEY environment variable');
  }
  if (!process.env.R2_ACCOUNT_ID) {
    throw new Error('Missing R2_ACCOUNT_ID environment variable');
  }
  if (!process.env.R2_ACCESS_KEY_ID) {
    throw new Error('Missing R2_ACCESS_KEY_ID environment variable');
  }
  if (!process.env.R2_SECRET_ACCESS_KEY) {
    throw new Error('Missing R2_SECRET_ACCESS_KEY environment variable');
  }
  if (!process.env.R2_BUCKET_NAME) {
    throw new Error('Missing R2_BUCKET_NAME environment variable');
  }

  const timestampFolder = getTimestampedFolder();
  const outputDir = path.join(DEFAULTS.outputDir, timestampFolder);
  const imagePath = path.join(outputDir, 'snippet.png');
  const bRollSegmentPath = path.join(outputDir, 'broll_segment.mp4');
  const videoPath = path.join(outputDir, 'reel.mp4');
  const captionPath = path.join(outputDir, 'caption.txt');

  await fs.mkdir(outputDir, { recursive: true });

  const duration = DEFAULTS.videoDuration;

  // Verify local files exist
  try {
    await fs.access(DEFAULTS.bRollPath);
  } catch {
    throw new Error(`B-roll video not found at: ${DEFAULTS.bRollPath}`);
  }

  try {
    await fs.access(DEFAULTS.audioFolder);
  } catch {
    throw new Error(`Audio folder not found at: ${DEFAULTS.audioFolder}`);
  }

  // Initialize cloud services
  const fileUploader = new FileUploadHelper({
    accountId: process.env.R2_ACCOUNT_ID,
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    bucketName: process.env.R2_BUCKET_NAME,
    publicDomain: process.env.R2_PUBLIC_DOMAIN, // Optional custom domain
  });

  const videoOps = new RendiVideoOperations({
    apiKey: process.env.RENDI_API_KEY,
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    // Step 1: Generate code snippet with AI
    console.log('Generating code snippet with AI...');
    const snippet = await generateSnippetWithAI();

    // Step 2: Render code snippet to image (still done locally)
    console.log('Rendering code snippet to image...');
    await renderSnippet(snippet.code, imagePath, browser);

    // Step 3: Get random audio file
    console.log('Selecting random audio file...');
    const audioPath = await getRandomAudioFile(DEFAULTS.audioFolder);

    // Step 4: Upload files to R2 for cloud processing
    console.log('Uploading files to R2...');
    const bRollUrl = await fileUploader.uploadToPublicStorage(DEFAULTS.bRollPath);
    const imageUrl = await fileUploader.uploadToPublicStorage(imagePath);
    const audioUrl = await fileUploader.uploadToPublicStorage(audioPath);

    // Step 5: Get video duration (still done locally with ffprobe)
    console.log('Getting video duration...');
    const totalDuration = await getVideoDuration(DEFAULTS.bRollPath);
    const maxStartTime = Math.max(0, totalDuration - duration);
    const startTime = Math.random() * maxStartTime;

    // Step 6: Extract random video segment using Rendi
    console.log('Extracting video segment in cloud...');
    await videoOps.extractVideoSegment(
      bRollUrl,
      bRollSegmentPath,
      duration,
      startTime,
    );

    // Step 7: Upload the segment for final processing
    console.log('Uploading segment to R2...');
    const segmentUrl = await fileUploader.uploadToPublicStorage(bRollSegmentPath);

    // Step 8: Overlay code image on video with audio using Rendi
    console.log('Overlaying code on video with audio in cloud...');
    await videoOps.overlayImageOnVideoWithAudio(
      segmentUrl,
      imageUrl,
      audioUrl,
      videoPath,
      duration,
      snippet.difficulty,
    );

    // Step 9: Clean up uploaded files from R2
    console.log('Cleaning up R2 files...');
    await fileUploader.cleanupAll();

    // Step 10: Write caption file
    const captionContent
      = `==================== REEL (CLOUD) ====================\n`
        + `DIFFICULTY: ${snippet.difficulty}\n\n`
        + `CODE:\n${snippet.code}\n\n`
        + `CAPTION:\n${snippet.caption}\n\n`
        + `AUDIO: ${path.basename(audioPath)}\n`
        + `PROCESSING: Rendi Cloud\n`;

    await fs.writeFile(captionPath, captionContent);

    console.log('✅ Cloud reel generation complete!');

    return {
      outputDir,
      videoPath,
      captionPath,
      imagePath,
      bRollSegmentPath,
      audioPath,
      snippet,
    };
  } catch (error) {
    console.error('❌ Cloud reel generation failed:', error);

    // Attempt cleanup on error
    try {
      await fileUploader.cleanupAll();
    } catch (cleanupError) {
      console.error('Failed to cleanup R2 files:', cleanupError);
    }

    throw error;
  } finally {
    await browser.close();
  }
}
