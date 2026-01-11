import fs from 'node:fs/promises';
import path from 'node:path';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import ffmpeg from 'fluent-ffmpeg';
import puppeteer, { type Browser } from 'puppeteer';
import { getHighlighter } from 'shiki';

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

  const audioFiles = files.filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.flac'].includes(ext);
  });

  if (audioFiles.length === 0) {
    throw new Error(`No audio files found in ${audioFolder}`);
  }

  const randomIndex = Math.floor(Math.random() * audioFiles.length);
  const selectedAudio = audioFiles[randomIndex];
  const audioPath = path.join(audioFolder, selectedAudio!);

  return audioPath;
}

async function extractRandomVideoSegment(
  inputVideo: string,
  outputVideo: string,
  duration: number,
): Promise<void> {
  const totalDuration = await getVideoDuration(inputVideo);
  const maxStartTime = Math.max(0, totalDuration - duration);
  const startTime = Math.random() * maxStartTime;

  return new Promise((resolve, reject) => {
    ffmpeg(inputVideo)
      .setStartTime(startTime)
      .setDuration(duration)
      .outputOptions([
        '-c:v libx264',
        '-pix_fmt yuv420p',
        '-vf scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920',
        '-preset medium',
        '-crf 23',
      ])
      .output(outputVideo)
      .on('end', () => {
        resolve();
      })
      .on('error', () => {
        reject(new Error('Failed to extract video segment.'));
      })
      .run();
  });
}

type HtmlOptions = {
  codeHtml: string;
  width: number;
  height: number;
  padding: number;
  background: string;
  font: string;
  fontSize: number;
};

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
}

async function overlayCodeOnVideoWithAudio(
  backgroundVideo: string,
  overlayImage: string,
  audioPath: string,
  outputVideo: string,
  duration: number,
  difficulty: string,
): Promise<void> {
  const levelY = 840;

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(backgroundVideo)
      .input(overlayImage)
      .input(audioPath)
      .complexFilter([
        '[1:v]scale=1080:1920[overlay]',
        '[0:v][overlay]overlay=0:0[video_base]',
        `[video_base]drawtext=`
        + `text='LEVEL\\: ${difficulty}':`
        + `fontfile=/System/Library/Fonts/Supplemental/Arial\\ Bold.ttf:`
        + `fontsize=42:`
        + `fontcolor=#818cf8:`
        + `borderw=2:`
        + `bordercolor=black:`
        + `x=(w-text_w)/2:`
        + `y=${levelY}:`
        + `enable='gte(t,${DEFAULTS.levelAppearTime})':`
        + `alpha='if(lt(t,${DEFAULTS.levelAppearTime}),0,if(lt(t,${DEFAULTS.levelAppearTime + 0.3}),(t-${DEFAULTS.levelAppearTime})/0.3,1))'`
        + `[video]`,
        `[2:a]atrim=0:${duration},asetpts=PTS-STARTPTS[audio]`,
      ])
      .outputOptions([
        '-map [video]',
        '-map [audio]',
        '-c:v libx264',
        '-c:a aac',
        '-b:a 192k',
        `-t ${duration}`,
        '-pix_fmt yuv420p',
        '-preset medium',
        '-crf 23',
        '-shortest',
      ])
      .output(outputVideo)
      .on('end', () => {
        resolve();
      })
      .on('error', () => {
        reject(new Error('Failed to overlay code on video with audio.'));
      })
      .run();
  });
}

export async function generateCodingChallengeReel(): Promise<CodingChallengeResult> {
  const timestampFolder = getTimestampedFolder();
  const outputDir = path.join(DEFAULTS.outputDir, timestampFolder);
  const imagePath = path.join(outputDir, 'snippet.png');
  const bRollSegmentPath = path.join(outputDir, 'broll_segment.mp4');
  const videoPath = path.join(outputDir, 'reel.mp4');
  const captionPath = path.join(outputDir, 'caption.txt');

  await fs.mkdir(outputDir, { recursive: true });

  const duration = DEFAULTS.videoDuration;

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

  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const snippet = await generateSnippetWithAI();

    await renderSnippet(snippet.code, imagePath, browser);

    await extractRandomVideoSegment(DEFAULTS.bRollPath, bRollSegmentPath, duration);

    const audioPath = await getRandomAudioFile(DEFAULTS.audioFolder);

    await overlayCodeOnVideoWithAudio(
      bRollSegmentPath,
      imagePath,
      audioPath,
      videoPath,
      duration,
      snippet.difficulty,
    );

    const captionContent
      = `==================== REEL ====================\n`
        + `DIFFICULTY: ${snippet.difficulty}\n\n`
        + `CODE:\n${snippet.code}\n\n`
        + `CAPTION:\n${snippet.caption}\n\n`
        + `AUDIO: ${path.basename(audioPath)}\n`;

    await fs.writeFile(captionPath, captionContent);

    return {
      outputDir,
      videoPath,
      captionPath,
      imagePath,
      bRollSegmentPath,
      audioPath,
      snippet,
    };
  } finally {
    await browser.close();
  }
}
