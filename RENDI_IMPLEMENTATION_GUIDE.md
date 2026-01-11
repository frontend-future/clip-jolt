# Rendi Cloud Video Processing - Implementation Guide

## ✅ What's Been Completed

### 1. Research & Selection
- ✅ Researched cloud video processing alternatives (Shotstack, Cloudinary, AWS MediaConvert)
- ✅ Selected Rendi.dev as the best option:
  - Most affordable ($25/month for 100GB vs $39+ for competitors)
  - FFmpeg compatible (no code rewrite needed)
  - Simple pricing (flat rate vs complex credit systems)
  - Easy migration (direct REST API for FFmpeg commands)

### 2. Integration Code
- ✅ Created `RendiService` class for API communication
- ✅ Created `RendiVideoOperations` class for high-level operations
- ✅ Created `FileUploadHelper` placeholder for cloud storage
- ✅ Added comprehensive documentation and examples
- ✅ Created test endpoint at `/api/test-rendi`
- ✅ Added test script (`test-rendi-simple.js`)

### 3. Testing
- ✅ Successfully tested basic Rendi API integration
- ✅ Verified command submission and polling works correctly
- ✅ Confirmed processing speed (2.3s total, 0.47s FFmpeg)

### 4. Branch Setup
- ✅ Created branch: `feature/rendi-cloud-video-processing`
- ✅ Committed all integration code
- ✅ Added API key to `.env.local`

## 📋 Next Steps (TODO)

### Phase 1: File Upload Implementation (CRITICAL)

**Problem:** Rendi requires publicly accessible URLs for input files. Your current code uses local file paths.

**Solution Options:**

#### Option A: AWS S3 (Recommended)
```bash
npm install @aws-sdk/client-s3
```

```typescript
// src/lib/rendi/S3Uploader.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs/promises';
import path from 'node:path';

export class S3Uploader {
  private s3: S3Client;
  private bucket: string;

  constructor(bucket: string, region = 'us-east-1') {
    this.s3 = new S3Client({ region });
    this.bucket = bucket;
  }

  async uploadFile(localPath: string): Promise<string> {
    const fileContent = await fs.readFile(localPath);
    const fileName = `rendi-temp/${Date.now()}-${path.basename(localPath)}`;
    
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: fileName,
      Body: fileContent,
      ACL: 'public-read',
    }));
    
    return `https://${this.bucket}.s3.amazonaws.com/${fileName}`;
  }
}
```

#### Option B: Cloudflare R2 (Cheaper)
Similar to S3 but with no egress fees. Use S3-compatible API.

#### Option C: Temporary Public Server
Set up a simple Express server to serve files temporarily during processing.

**Action Items:**
1. Choose storage provider (S3, R2, or temporary server)
2. Implement `FileUploadHelper.uploadToPublicStorage()`
3. Add cleanup logic to delete files after processing

### Phase 2: Update Reel Generator Functions

Replace local FFmpeg operations with Rendi calls:

#### File: `src/lib/reel-generator/generateCodingChallengeReel.ts`

**Current (Local FFmpeg):**
```typescript
await extractRandomVideoSegment(DEFAULTS.bRollPath, bRollSegmentPath, duration);
await overlayCodeOnVideoWithAudio(
  bRollSegmentPath,
  imagePath,
  audioPath,
  videoPath,
  duration,
  snippet.difficulty,
);
```

**New (Rendi Cloud):**
```typescript
import { RendiVideoOperations } from '@/lib/rendi';
import { S3Uploader } from '@/lib/rendi/S3Uploader';

const uploader = new S3Uploader(process.env.S3_BUCKET!);
const videoOps = new RendiVideoOperations({
  apiKey: process.env.RENDI_API_KEY!,
});

// Upload files to S3
const bRollUrl = await uploader.uploadFile(DEFAULTS.bRollPath);
const imageUrl = await uploader.uploadFile(imagePath);
const audioUrl = await uploader.uploadFile(audioPath);

// Get video duration (still needs local ffprobe for now)
const totalDuration = await getVideoDuration(DEFAULTS.bRollPath);
const startTime = Math.random() * Math.max(0, totalDuration - duration);

// Extract segment
await videoOps.extractVideoSegment(
  bRollUrl,
  bRollSegmentPath,
  duration,
  startTime,
);

// Upload the segment
const segmentUrl = await uploader.uploadFile(bRollSegmentPath);

// Overlay
await videoOps.overlayImageOnVideoWithAudio(
  segmentUrl,
  imageUrl,
  audioUrl,
  videoPath,
  duration,
  snippet.difficulty,
);

// Cleanup S3 files (optional)
// await uploader.deleteFile(bRollUrl);
// await uploader.deleteFile(imageUrl);
// ...
```

#### File: `src/lib/reel-generator/generateReadCaptionReel.ts`

Similar changes needed for:
- `extractSegment()` → `videoOps.extractVideoSegment()`
- `loopVideo()` → Custom implementation or keep local
- Resize operation → `videoOps.resizeAndCropVideo()`
- Text overlays → `videoOps.addTextOverlays()`

### Phase 3: Handle Edge Cases

#### 1. Video Duration Detection
**Problem:** Need video duration to calculate random start times.

**Solution:**
- Keep local `ffprobe` for now (fast, no upload needed)
- Or use Rendi's ffprobe endpoint (check docs)

#### 2. Font Files
**Problem:** `drawtext` filter needs font file paths.

**Solution:**
- Upload fonts to S3 once, use permanent URLs
- Or use system fonts available on Rendi servers
- Or embed font data in command (if supported)

#### 3. Temporary Files
**Problem:** Current code creates many temp files.

**Solution:**
- Upload only necessary files
- Clean up S3 after processing
- Consider using Rendi's chained commands for multi-step operations

### Phase 4: Testing & Validation

1. **Unit Tests**
   ```bash
   # Test individual operations
   npm test src/lib/rendi/RendiService.test.ts
   ```

2. **Integration Tests**
   ```bash
   # Test full reel generation
   curl -X POST http://localhost:3000/api/generate/coding-challenge
   ```

3. **Performance Comparison**
   - Measure local vs cloud processing time
   - Monitor costs (GB processed)
   - Check output quality

### Phase 5: Database Migration (LATER)

**User's Note:** "lets make sure thats working correctly first before we attempt to mod our db"

Once everything works:
1. Add `processing_method` field to database (local/cloud)
2. Add `rendi_command_id` field for tracking
3. Store processing metrics (time, cost)
4. Add toggle for local vs cloud processing

## 🚀 Quick Start Guide

### 1. Set Up File Upload

Choose your storage provider and implement:

```typescript
// src/lib/rendi/FileUploadHelper.ts
async uploadToPublicStorage(localPath: string): Promise<string> {
  // YOUR IMPLEMENTATION HERE
  // Return public URL
}
```

### 2. Test File Upload

```typescript
import { FileUploadHelper } from '@/lib/rendi';

const helper = new FileUploadHelper();
const url = await helper.uploadToPublicStorage('./test.mp4');
console.log('Uploaded:', url);
```

### 3. Update One Function

Start with the simplest operation:

```typescript
// src/lib/reel-generator/generateCodingChallengeReel.ts

// Add at top:
import { RendiVideoOperations } from '@/lib/rendi';
import { FileUploadHelper } from '@/lib/rendi';

// In function:
const uploader = new FileUploadHelper();
const videoOps = new RendiVideoOperations({
  apiKey: process.env.RENDI_API_KEY!,
});

// Replace ONE operation first
const bRollUrl = await uploader.uploadToPublicStorage(DEFAULTS.bRollPath);
await videoOps.extractVideoSegment(
  bRollUrl,
  bRollSegmentPath,
  duration,
  startTime,
);
```

### 4. Test & Iterate

```bash
# Test the modified function
curl -X POST http://localhost:3000/api/generate/coding-challenge

# Check output
ls -lh public/generated/
```

### 5. Gradually Replace More Operations

Once one operation works, replace others one by one.

## 📊 Cost Estimation

**Free Tier:**
- 50GB/month
- ~10,000 short videos (5MB each)
- Perfect for testing

**Pro Tier ($25/month):**
- 100GB/month
- ~20,000 short videos
- Good for production

**Current Usage Estimate:**
- 7-second 1080x1920 video ≈ 5-10MB
- Processing time: ~10-30 seconds
- Cost per video: ~$0.00125 (at Pro tier)

## ⚠️ Important Notes

### What's Working
✅ Rendi API integration
✅ Command submission and polling
✅ File download from Rendi storage
✅ Basic video operations

### What Needs Implementation
❌ File upload to public storage (CRITICAL)
❌ Integration with existing reel generators
❌ Font file handling
❌ Video duration detection via Rendi
❌ Cleanup logic for temporary files

### Limitations
- Free tier: 1-minute max runtime per command
- Pro tier: 10-minute max runtime
- Input files must be publicly accessible
- Font files need to be accessible or embedded

## 🔧 Environment Variables Needed

```bash
# .env.local
RENDI_API_KEY=eJwzSTMxM0o1t6NA1tjRK0TWxME3VtTBNS9RNSUlKS7IwszA3MrSIz03yTPMs8zLKLjQMCTUqyix0z/fxLgcA4iIRbw==

# For S3 upload (if using S3)
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name

# Or for Cloudflare R2
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_key
R2_SECRET_ACCESS_KEY=your_secret
R2_BUCKET=your-bucket-name
```

## 📚 Resources

- Rendi Documentation: https://docs.rendi.dev
- Integration Code: `src/lib/rendi/`
- Test Endpoint: `src/app/api/test-rendi/route.ts`
- Test Script: `test-rendi-simple.js`
- Examples: `src/lib/rendi/example-usage.ts`

## 🎯 Success Criteria

Before merging to main:
- [ ] File upload implementation complete
- [ ] At least one reel generator function migrated
- [ ] End-to-end test passes
- [ ] Output quality matches local processing
- [ ] Processing time is acceptable
- [ ] Cost per video is within budget

## 🤝 Getting Help

If you get stuck:
1. Check `src/lib/rendi/README.md` for detailed docs
2. Review `example-usage.ts` for code examples
3. Test with `test-rendi-simple.js` to verify API works
4. Check Rendi docs: https://docs.rendi.dev

Good luck! 🚀
