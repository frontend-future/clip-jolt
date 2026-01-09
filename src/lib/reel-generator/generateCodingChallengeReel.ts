/* eslint-disable no-console */
import fs from 'node:fs/promises';
import path from 'node:path';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import puppeteer, { type Browser } from 'puppeteer';
import { getHighlighter } from 'shiki';

import { Env } from '@/libs/Env';

import { createRendiClient } from '../rendi/client';
import { CODING_CHALLENGE_PROMPT, DEFAULTS, RENDI_CONFIG } from './constants';
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

  console.log('Generating snippet with OpenAI...');
  console.log('Using API key:', process.env.OPENAI_API_KEY?.slice(0, 10) + '...');

  try {
    console.log('Calling OpenAI API...');
    const response = await generateText({
      model: openai('gpt-4o'),
      prompt: CODING_CHALLENGE_PROMPT,
      maxTokens: 500,
      temperature: 0.9,
    });

    console.log('OpenAI response received');
    console.log('Raw response:', response.text.slice(0, 100) + '...');

    let cleanText = response.text.trim();
    cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?/g, '');

    console.log('Parsing JSON response...');
    const snippet = JSON.parse(cleanText) as CodingSnippet;
    console.log('Snippet generated:', snippet.difficulty);
    return snippet;
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw error;
  }
}

async function getRandomAudioUrl(): Promise<string> {
  console.log('\nSelecting random audio file...');

  const audioFiles = RENDI_CONFIG.audioFiles;

  if (audioFiles.length === 0) {
    throw new Error('No audio files configured in RENDI_CONFIG');
  }

  const randomIndex = Math.floor(Math.random() * audioFiles.length);
  const selectedAudio = audioFiles[randomIndex]!;
  const audioUrl = `${RENDI_CONFIG.audioFolderUrl}/${selectedAudio}`;

  console.log(`Selected audio: ${selectedAudio}`);
  console.log(`Audio URL: ${audioUrl}`);

  return audioUrl;
}

interface HtmlOptions {
  codeHtml: string;
  width: number;
  height: number;
  padding: number;
  background: string;
  font: string;
  fontSize: number;
}

function buildHtml({ codeHtml, width, height, padding, font, fontSize }: HtmlOptions): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>snippet</title>
  <style>
    :root {
      --frame-radius: 16px;
      --frame-bg: #0b1120;
      --chrome-bg: linear-gradient(90deg, #0f172a 0%, #111827 100%);
      --chrome-border: rgba(148, 163, 184, 0.16);
      --shadow: 0 30px 60px rgba(2, 6, 23, 0.6);
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      width: ${width}px;
      height: ${height}px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
      gap: 60px;
      background: transparent;
      font-family: ${font};
      padding: ${padding}px;
    }
    .header {
      text-align: center;
      color: #e2e8f0;
      padding: 30px 60px;
    }
    .header h1 {
      font-size: 72px;
      font-weight: 700;
      margin: 0;
      letter-spacing: -0.02em;
      text-shadow:
        -2px -2px 0 #000,
        2px -2px 0 #000,
        -2px 2px 0 #000,
        2px 2px 0 #000,
        0 0 20px rgba(0, 0, 0, 0.5);
    }
    .frame {
      margin-top: 50px;
      width: ${width - padding * 2}px;
      background: var(--frame-bg);
      border-radius: var(--frame-radius);
      box-shadow: var(--shadow);
      overflow: hidden;
      border: 1px solid rgba(148, 163, 184, 0.18);
      backdrop-filter: blur(10px);
    }
    .chrome {
      height: 50px;
      display: flex;
      align-items: center;
      padding: 0 20px;
      gap: 16px;
      background: var(--chrome-bg);
      border-bottom: 1px solid var(--chrome-border);
      color: #cbd5f5;
      font-size: 14px;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .dots { display: flex; gap: 10px; }
    .dot { width: 14px; height: 14px; border-radius: 999px; }
    .dot.red { background: #f87171; }
    .dot.yellow { background: #facc15; }
    .dot.green { background: #4ade80; }
    .code {
      padding: 40px;
      font-size: ${fontSize}px;
      line-height: 1.6;
      color: #e2e8f0;
    }
    .code pre,
    .code code {
      margin: 0;
      white-space: pre;
      font-family: inherit;
    }
    .code pre.shiki {
      background: transparent !important;
      padding: 0 !important;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>What Is The Output?</h1>
  </div>
  <div class="frame">
    <div class="chrome">
      <div class="dots">
        <span class="dot red"></span>
        <span class="dot yellow"></span>
        <span class="dot green"></span>
      </div>
    </div>
    <div class="code">
      ${codeHtml}
    </div>
  </div>
</body>
</html>`;
}

async function renderSnippet(
  code: string,
  outputPath: string,
  browser: Browser,
): Promise<void> {
  const highlighter = await getHighlighter({
    themes: ['nord'],
    langs: ['javascript'],
  });

  const codeHtml = highlighter.codeToHtml(code, {
    lang: 'javascript',
    theme: 'nord',
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    deviceScaleFactor: DEFAULTS.scale,
  });

  const html = buildHtml({
    codeHtml,
    width: DEFAULTS.width,
    height: DEFAULTS.height,
    padding: DEFAULTS.padding,
    background: DEFAULTS.background,
    font: DEFAULTS.font,
    fontSize: DEFAULTS.fontSize,
  });

  await page.setContent(html, { waitUntil: 'load' });

  await page.screenshot({
    path: outputPath,
    fullPage: false,
    omitBackground: true,
  });
  await page.close();

  console.log(`Rendered: ${outputPath}`);
}

async function processVideoWithRendi(
  screenshotPath: string,
  audioUrl: string,
  outputPath: string,
  duration: number,
  difficulty: string,
): Promise<void> {
  console.log('\n🎬 Processing video with Rendi...');

  const rendiClient = createRendiClient(Env.RENDI_API_KEY);

  // Step 1: Upload screenshot to Rendi
  console.log('\n📤 Uploading screenshot to Rendi...');
  const screenshotBuffer = await fs.readFile(screenshotPath);
  const screenshotUpload = await rendiClient.uploadFile(
    screenshotBuffer,
    'code-screenshot.png',
    'image/png',
  );
  console.log(`✅ Screenshot uploaded: ${screenshotUpload.file_id}`);

  // Step 2: Extract random segment from bRoll video
  console.log('\n✂️  Extracting random segment from b-roll video...');

  // We need to know the total duration of the bRoll to pick a random start time
  // For now, we'll assume a typical length or use a fixed start time
  // In a production setup, you could store this metadata or use Rendi's FFprobe
  const randomStartTime = Math.floor(Math.random() * 30); // Assume bRoll is at least 30s long

  const extractCommand = `-ss ${randomStartTime} -t ${duration} -i {{in_broll}} -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920" -c:v libx264 -crf 23 -preset medium -pix_fmt yuv420p {{out_segment}}`;

  const extractResult = await rendiClient.runFFmpegCommand({
    ffmpeg_command: extractCommand,
    input_files: {
      in_broll: RENDI_CONFIG.bRollUrl,
    },
    output_files: {
      out_segment: 'broll_segment.mp4',
    },
  });

  console.log(`Command submitted: ${extractResult.command_id}`);
  const extractOutput = await rendiClient.pollCommandStatus(extractResult.command_id);
  const segmentUrl = extractOutput.out_segment!.storage_url;
  console.log(`✅ Segment extracted: ${segmentUrl}`);

  // Step 3: Overlay code screenshot and add audio
  console.log('\n🎨 Overlaying code and adding audio...');

  const levelY = 840;
  const levelAppearTime = DEFAULTS.levelAppearTime;

  const overlayCommand
    = `-i {{in_segment}} -i {{in_screenshot}} -i {{in_audio}} -filter_complex `
    + `"[1:v]scale=1080:1920[overlay];`
    + `[0:v][overlay]overlay=0:0[video_base];`
    + `[video_base]drawtext=`
    + `text='LEVEL\\\\: ${difficulty}':`
    + `fontfile=/System/Library/Fonts/Supplemental/Arial\\\\ Bold.ttf:`
    + `fontsize=42:`
    + `fontcolor=#818cf8:`
    + `borderw=2:`
    + `bordercolor=black:`
    + `x=(w-text_w)/2:`
    + `y=${levelY}:`
    + `enable='gte(t,${levelAppearTime})':`
    + `alpha='if(lt(t,${levelAppearTime}),0,if(lt(t,${levelAppearTime + 0.3}),(t-${levelAppearTime})/0.3,1))'`
    + `[video];`
    + `[2:a]atrim=0:${duration},asetpts=PTS-STARTPTS[audio]" `
    + `-map "[video]" -map "[audio]" -c:v libx264 -c:a aac -b:a 192k -t ${duration} -crf 23 -preset medium -pix_fmt yuv420p {{out_final}}`;

  const overlayResult = await rendiClient.runFFmpegCommand({
    ffmpeg_command: overlayCommand,
    input_files: {
      in_segment: segmentUrl,
      in_screenshot: screenshotUpload.storage_url,
      in_audio: audioUrl,
    },
    output_files: {
      out_final: 'reel.mp4',
    },
  });

  console.log(`Command submitted: ${overlayResult.command_id}`);
  const overlayOutput = await rendiClient.pollCommandStatus(overlayResult.command_id);
  const finalVideoUrl = overlayOutput.out_final!.storage_url;
  console.log(`✅ Final video created: ${finalVideoUrl}`);

  // Step 4: Download final video
  console.log('\n📥 Downloading final video...');
  await rendiClient.downloadFileByUrl(finalVideoUrl, outputPath);
  console.log(`✅ Video saved: ${outputPath}`);
}

export async function generateCodingChallengeReel(): Promise<CodingChallengeResult> {
  const timestampFolder = getTimestampedFolder();
  const outputDir = path.join(DEFAULTS.outputDir, timestampFolder);
  const imagePath = path.join(outputDir, 'snippet.png');
  const videoPath = path.join(outputDir, 'reel.mp4');
  const captionPath = path.join(outputDir, 'caption.txt');

  await fs.mkdir(outputDir, { recursive: true });
  console.log(`\nOutput directory: ${outputDir}\n`);

  const duration = DEFAULTS.videoDuration;

  console.log(`Generating 1 code snippet for a ${duration}s video...\n`);

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const snippet = await generateSnippetWithAI();

    await renderSnippet(snippet.code, imagePath, browser);

    const audioUrl = await getRandomAudioUrl();

    await processVideoWithRendi(imagePath, audioUrl, videoPath, duration, snippet.difficulty);

    const captionContent =
      `==================== REEL ====================\n` +
      `DIFFICULTY: ${snippet.difficulty}\n\n` +
      `CODE:\n${snippet.code}\n\n` +
      `CAPTION:\n${snippet.caption}\n\n` +
      `AUDIO: ${audioUrl}\n`;

    await fs.writeFile(captionPath, captionContent);
    console.log(`Caption saved: ${captionPath}`);

    console.log('\n' + '='.repeat(60));
    console.log('ALL DONE!');
    console.log('='.repeat(60));
    console.log(`Folder: ${outputDir}`);
    console.log(`Video: ${videoPath}`);
    console.log(`Caption: ${captionPath}`);
    console.log(`Image: ${imagePath}`);
    console.log(`Audio: ${audioUrl}`);

    return {
      outputDir,
      videoPath,
      captionPath,
      imagePath,
      bRollSegmentPath: '', // No longer stored locally with Rendi
      audioPath: audioUrl,
      snippet,
    };
  } finally {
    await browser.close();
  }
}
