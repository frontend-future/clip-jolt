# Cloudflare R2 Setup Guide for Rendi Integration

This guide walks you through setting up Cloudflare R2 for cloud-based video processing with Rendi.

---

## 📋 What You Need From Your Cloudflare Account

### 1. R2 Bucket

**Create an R2 Bucket:**

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **R2** in the sidebar
3. Click **Create bucket**
4. Choose a name (e.g., `clip-jolt-rendi-temp`)
5. Click **Create bucket**

**Make Bucket Public (Required for Rendi):**

1. Open your bucket
2. Go to **Settings** tab
3. Scroll to **Public access**
4. Click **Allow Access**
5. Copy the **Public bucket URL** (e.g., `https://pub-xxxxx.r2.dev`)

### 2. R2 API Token

**Create API Token:**

1. In R2 dashboard, click **Manage R2 API Tokens**
2. Click **Create API token**
3. Choose **Edit** permissions (or **Read & Write**)
4. Select your bucket (or **Apply to all buckets**)
5. Click **Create API Token**
6. **IMPORTANT**: Copy these values immediately (they won't be shown again):
   - **Access Key ID**
   - **Secret Access Key**

### 3. Account ID

**Find Your Account ID:**

1. In Cloudflare Dashboard, look at the URL
2. It's the string after `/accounts/` in the URL
3. Or go to **R2** → **Overview** and find it there
4. Format: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (32 characters)

---

## 🔧 Environment Variables Setup

Add these to your `.env.local` file:

```bash
# Rendi API Key (already added)
RENDI_API_KEY=eJwzSTMxM0o1t6NA1tjRK0TWxME3VtTBNS9RNSUlKS7IwszA3MrSIz03yTPMs8zLKLjQMCTUqyix0z/fxLgcA4iIRbw==

# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_id_here
R2_SECRET_ACCESS_KEY=your_secret_access_key_here
R2_BUCKET_NAME=clip-jolt-rendi-temp
R2_PUBLIC_DOMAIN=https://pub-xxxxx.r2.dev
```

### Example with Real Values:

```bash
# Example (replace with your actual values)
R2_ACCOUNT_ID=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
R2_ACCESS_KEY_ID=1234567890abcdef1234567890abcdef
R2_SECRET_ACCESS_KEY=abcdef1234567890abcdef1234567890abcdef1234567890abcdef12
R2_BUCKET_NAME=clip-jolt-rendi-temp
R2_PUBLIC_DOMAIN=https://pub-a1b2c3d4e5f6g7h8.r2.dev
```

---

## ✅ Testing Your Setup

### Step 1: Test R2 Connection

```bash
cd /home/ubuntu/clip-jolt
node test-r2-upload.js
```

**Expected Output:**
```
Testing Cloudflare R2 connection...

✓ Environment variables found
  Account ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
  Bucket: clip-jolt-rendi-temp

Test 1: Listing bucket contents...
✓ Successfully accessed bucket
  Objects in bucket: 0

Test 2: Uploading test file...
✓ Successfully uploaded test file
  Key: test-uploads/test-1234567890.txt

Public URL (if bucket is public):
  https://pub-xxxxx.r2.dev/test-uploads/test-1234567890.txt

✅ All R2 tests PASSED
```

### Step 2: Test Rendi Integration

```bash
node test-rendi-simple.js
```

**Expected Output:**
```
✅ Rendi integration test PASSED
```

### Step 3: Test Full Cloud Reel Generation

**Start your dev server:**
```bash
npm run dev
```

**In another terminal, test the endpoint:**
```bash
curl -X POST http://localhost:3000/api/generate-reel-cloud
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Cloud reel generated successfully",
  "result": {
    "outputDir": "/path/to/output",
    "videoPath": "/path/to/reel.mp4",
    "difficulty": "MEDIUM",
    "code": "...",
    "caption": "..."
  }
}
```

---

## 🔍 Troubleshooting

### Error: "Missing R2_ACCOUNT_ID environment variable"

**Solution:** Make sure `.env.local` has all required variables and restart your dev server.

```bash
# Check if variables are set
cat .env.local | grep R2_

# Restart dev server
npm run dev
```

### Error: "NoSuchBucket"

**Causes:**
- Bucket name is incorrect
- Bucket doesn't exist
- API token doesn't have access to this bucket

**Solution:**
1. Verify bucket name in Cloudflare dashboard
2. Check bucket exists
3. Recreate API token with correct permissions

### Error: "InvalidAccessKeyId"

**Solution:** Your `R2_ACCESS_KEY_ID` is incorrect. Copy it again from Cloudflare.

### Error: "SignatureDoesNotMatch"

**Solution:** Your `R2_SECRET_ACCESS_KEY` is incorrect. You'll need to create a new API token.

### Error: "Access Denied" when Rendi tries to access files

**Cause:** Bucket is not public.

**Solution:**
1. Go to bucket settings in Cloudflare
2. Enable **Public access**
3. Update `R2_PUBLIC_DOMAIN` in `.env.local`

### Files not cleaning up from R2

**This is normal during testing.** The cleanup happens at the end of successful processing.

**Manual cleanup:**
```bash
# List files
aws s3 ls s3://your-bucket-name/rendi-temp/ \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com

# Delete old files
aws s3 rm s3://your-bucket-name/rendi-temp/ --recursive \
  --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

Or use the Cloudflare dashboard to delete files manually.

---

## 💰 Cost Considerations

### Cloudflare R2 Pricing

**Free Tier (Generous):**
- **Storage**: 10 GB free
- **Class A operations**: 1 million/month (uploads)
- **Class B operations**: 10 million/month (downloads)
- **Egress**: FREE (no bandwidth charges!)

**Paid Tier (if you exceed free tier):**
- **Storage**: $0.015/GB/month
- **Class A**: $4.50 per million operations
- **Class B**: $0.36 per million operations

### Typical Usage for Video Processing

**Per video reel (7 seconds):**
- Upload: 3-5 files (~20-50 MB total)
- Storage: Temporary (deleted after processing)
- Downloads: 1 file by Rendi
- Cost: **~$0.00001** (essentially free)

**For 10,000 videos/month:**
- Class A operations: ~40,000 (well within free tier)
- Storage: Temporary, negligible
- **Total R2 cost: $0** (within free tier)

### Combined Cost (Rendi + R2)

- **Rendi Pro**: $25/month (100GB processing)
- **R2**: $0/month (within free tier)
- **Total**: $25/month for ~20,000 videos

---

## 🚀 Next Steps

Once your setup is working:

### 1. Replace Local Processing

Update your existing code to use cloud processing:

```typescript
// OLD: Local processing
import { generateCodingChallengeReel } from '@/lib/reel-generator/generateCodingChallengeReel';
const result = await generateCodingChallengeReel();

// NEW: Cloud processing
import { generateCodingChallengeReelCloud } from '@/lib/reel-generator/generateCodingChallengeReelCloud';
const result = await generateCodingChallengeReelCloud();
```

### 2. Add Feature Flag

Allow switching between local and cloud processing:

```typescript
// .env.local
USE_CLOUD_PROCESSING=true

// In your code
const useCloud = process.env.USE_CLOUD_PROCESSING === 'true';
const result = useCloud 
  ? await generateCodingChallengeReelCloud()
  : await generateCodingChallengeReel();
```

### 3. Migrate Other Generators

Apply the same pattern to:
- `generateReadCaptionReel.ts` → `generateReadCaptionReelCloud.ts`
- Any other video processing functions

### 4. Monitor Usage

**Cloudflare R2:**
- Dashboard → R2 → Your bucket → Metrics
- Track storage, operations, bandwidth

**Rendi:**
- Dashboard → Usage
- Track GB processed, commands run

### 5. Production Deployment

Before deploying to production:

1. **Set up custom domain for R2** (optional but recommended)
   - Go to R2 bucket settings
   - Add custom domain
   - Update `R2_PUBLIC_DOMAIN` in production env vars

2. **Add error monitoring**
   - Log R2 upload failures
   - Log Rendi processing failures
   - Set up alerts for high error rates

3. **Implement retry logic**
   - Retry failed uploads
   - Retry failed Rendi commands
   - Fall back to local processing if cloud fails

4. **Set up automated cleanup**
   - Schedule job to delete old temp files
   - R2 lifecycle rules (if available)

---

## 📚 Additional Resources

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **Rendi Docs**: https://docs.rendi.dev
- **AWS SDK for R2**: https://developers.cloudflare.com/r2/api/s3/api/

---

## 🎯 Summary Checklist

- [ ] Created R2 bucket
- [ ] Made bucket public
- [ ] Created API token
- [ ] Added all env vars to `.env.local`
- [ ] Tested R2 connection (`node test-r2-upload.js`)
- [ ] Tested Rendi integration (`node test-rendi-simple.js`)
- [ ] Tested full cloud generation (`curl -X POST .../api/generate-reel-cloud`)
- [ ] Verified output video quality
- [ ] Ready to replace local processing!

---

**You're all set! 🎉**

Your video processing will now run in the cloud, freeing up your local machine and enabling scalable video generation.
