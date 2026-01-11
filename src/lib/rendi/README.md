# Rendi Cloud Video Processing Integration

This module provides integration with [Rendi.dev](https://rendi.dev) for cloud-based FFmpeg video processing, replacing local FFmpeg operations with scalable cloud processing.

## Overview

**Rendi** is an FFmpeg-as-a-Service platform that allows you to run FFmpeg commands in the cloud without managing servers or infrastructure. This integration replaces local `fluent-ffmpeg` operations with Rendi API calls.

## Why Rendi?

- **No local processing**: Video processing runs in the cloud, freeing up your server resources
- **Scalable**: Auto-scales with demand, no cold starts
- **Cost-effective**: $25/month for 100GB processing (Free tier: 50GB/month)
- **FFmpeg compatible**: Use standard FFmpeg commands, no proprietary API to learn
- **Fast**: High CPU/memory servers, faster than serverless options
- **Reliable**: 99.9% uptime commitment

## Architecture

```
┌─────────────────────┐
│  Your Application   │
│  (Next.js API)      │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  RendiService       │ ← Core API wrapper
│  - submitCommand()  │
│  - pollCommand()    │
│  - submitAndWait()  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ RendiVideoOperations│ ← High-level operations
│  - extractSegment() │
│  - overlayImage()   │
│  - resizeVideo()    │
│  - addTextOverlays()│
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   Rendi API         │
│   api.rendi.dev     │
└─────────────────────┘
```

## Setup

### 1. Environment Variables

Add your Rendi API key to `.env.local`:

```bash
RENDI_API_KEY=eJwzSTMxM0o1t6NA1tjRK0TWxME3VtTBNS9RNSUlKS7IwszA3MrSIz03yTPMs8zLKLjQMCTUqyix0z/fxLgcA4iIRbw==
```

### 2. File Upload Strategy

Rendi requires **publicly accessible URLs** for input files. You need to implement one of these strategies:

#### Option A: Upload to Cloud Storage (Recommended)
Upload files to S3, Cloudflare R2, or similar before processing:

```typescript
// Example with S3
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

async function uploadToS3(localPath: string): Promise<string> {
  const s3 = new S3Client({ region: 'us-east-1' });
  const fileContent = await fs.readFile(localPath);
  const fileName = path.basename(localPath);
  
  await s3.send(new PutObjectCommand({
    Bucket: 'your-bucket',
    Key: fileName,
    Body: fileContent,
    ACL: 'public-read',
  }));
  
  return `https://your-bucket.s3.amazonaws.com/${fileName}`;
}
```

#### Option B: Use Existing Public URLs
If your files are already accessible via public URLs (e.g., from your CDN), use those directly.

#### Option C: Rendi File Storage
Check if Rendi provides a file upload API for temporary storage.

### 3. Update FileUploadHelper

Implement the `uploadToPublicStorage()` method in `FileUploadHelper.ts` with your chosen strategy.

## Usage

### Basic Usage

```typescript
import { RendiService } from '@/lib/rendi';

const rendi = new RendiService({
  apiKey: process.env.RENDI_API_KEY!,
});

// Submit and wait for completion
const result = await rendi.submitAndWait({
  ffmpeg_command: '-i {{in_1}} -vf scale=1080:1920 {{out_1}}',
  input_files: {
    in_1: 'https://your-storage.com/input.mp4',
  },
  output_files: {
    out_1: 'output.mp4',
  },
  vcpu_count: 4,
});

// Download result
await rendi.downloadFile(
  result.output_files!.out_1!.storage_url,
  './output.mp4'
);
```

### High-Level Operations

```typescript
import { RendiVideoOperations } from '@/lib/rendi';

const videoOps = new RendiVideoOperations({
  apiKey: process.env.RENDI_API_KEY!,
});

// Extract video segment
await videoOps.extractVideoSegment(
  'https://your-storage.com/video.mp4',
  './segment.mp4',
  10, // duration in seconds
  5,  // start time in seconds
);

// Overlay image on video with audio
await videoOps.overlayImageOnVideoWithAudio(
  'https://your-storage.com/background.mp4',
  'https://your-storage.com/overlay.png',
  'https://your-storage.com/audio.mp3',
  './output.mp4',
  7,        // duration
  'MEDIUM', // level text
);
```

## Migration Guide

### Before (Local FFmpeg)

```typescript
import ffmpeg from 'fluent-ffmpeg';

function extractSegment(input: string, output: string, duration: number) {
  return new Promise((resolve, reject) => {
    ffmpeg(input)
      .setStartTime(startTime)
      .setDuration(duration)
      .output(output)
      .on('end', resolve)
      .on('error', reject)
      .run();
  });
}
```

### After (Rendi Cloud)

```typescript
import { RendiVideoOperations } from '@/lib/rendi';

const videoOps = new RendiVideoOperations({
  apiKey: process.env.RENDI_API_KEY!,
});

async function extractSegment(
  inputUrl: string,
  output: string,
  duration: number,
  startTime: number
) {
  await videoOps.extractVideoSegment(inputUrl, output, duration, startTime);
}
```

## API Reference

### RendiService

Core service for interacting with Rendi API.

#### Methods

- `submitCommand(request)` - Submit FFmpeg command, returns command ID
- `pollCommand(commandId)` - Check status of command
- `submitAndWait(request)` - Submit and automatically poll until completion
- `downloadFile(url, outputPath)` - Download result file

### RendiVideoOperations

High-level video operations that wrap common FFmpeg patterns.

#### Methods

- `extractVideoSegment(inputUrl, outputPath, duration, startTime)` - Extract video segment
- `overlayImageOnVideoWithAudio(bgUrl, overlayUrl, audioUrl, outputPath, duration, levelText)` - Overlay image with audio
- `resizeAndCropVideo(inputUrl, outputPath)` - Resize to 1080x1920
- `addTextOverlays(inputUrl, outputPath, mainText, subText, fontPath, audioUrl?)` - Add text overlays

## Testing

### Manual Testing

1. Set `RENDI_API_KEY` environment variable
2. Run example file:

```bash
npx ts-node src/lib/rendi/example-usage.ts
```

### Integration Testing

Create a test API endpoint:

```typescript
// src/app/api/test-rendi/route.ts
import { RendiVideoOperations } from '@/lib/rendi';

export async function POST() {
  const videoOps = new RendiVideoOperations({
    apiKey: process.env.RENDI_API_KEY!,
  });

  await videoOps.extractVideoSegment(
    'https://storage.rendi.dev/sample/sample.avi',
    './test-output.mp4',
    5,
    0,
  );

  return Response.json({ success: true });
}
```

Test with:
```bash
curl -X POST http://localhost:3000/api/test-rendi
```

## Limitations & TODOs

### Current Limitations

1. **File Upload Not Implemented**: `FileUploadHelper.uploadToPublicStorage()` needs implementation
2. **Video Duration**: Getting video duration still requires local ffprobe or Rendi's ffprobe endpoint
3. **Font Files**: Font files for drawtext need to be publicly accessible or uploaded
4. **Random Segments**: Extracting random segments requires knowing video duration first

### TODO

- [ ] Implement cloud storage upload (S3/R2)
- [ ] Add support for Rendi's ffprobe endpoint
- [ ] Handle font file uploads
- [ ] Add retry logic for failed operations
- [ ] Add progress callbacks for long operations
- [ ] Implement batch processing for multiple videos
- [ ] Add cost estimation before processing
- [ ] Create migration script for existing code

## Cost Estimation

**Free Tier:**
- 50GB processing/month
- 1-minute max runtime per command
- 4 vCPUs

**Pro Tier ($25/month):**
- 100GB processing/month
- 10-minute max runtime
- 4 vCPUs
- Unlimited commands per minute

**Typical Usage:**
- 7-second 1080x1920 video ≈ 5-10MB
- 100GB = ~10,000-20,000 short videos
- Processing time: ~10-30 seconds per video

## Troubleshooting

### "File not publicly accessible"
Ensure input file URLs are publicly accessible without authentication.

### "Command timeout"
Increase `max_command_run_seconds` or upgrade to Pro tier for longer runtimes.

### "Polling timeout"
Increase `maxPollAttempts` in RendiService config.

### "Font not found"
Upload font files to public storage and use public URLs in drawtext commands.

## Support

- Rendi Documentation: https://docs.rendi.dev
- Rendi Support: https://rendi.dev/support
- GitHub Issues: [Create issue in this repo]

## License

Same as parent project.
