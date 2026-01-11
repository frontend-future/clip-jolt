// Test script for R2 upload functionality
// This verifies that R2 credentials are working before testing full reel generation

const { S3Client, PutObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

async function testR2Connection() {
  console.log('Testing Cloudflare R2 connection...\n');

  // Get credentials from environment
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  // Validate credentials
  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error('❌ Missing R2 credentials in environment variables:');
    console.error('   Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME');
    process.exit(1);
  }

  console.log('✓ Environment variables found');
  console.log(`  Account ID: ${accountId}`);
  console.log(`  Bucket: ${bucketName}\n`);

  // Create S3 client for R2
  const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });

  try {
    // Test 1: List objects (verify bucket access)
    console.log('Test 1: Listing bucket contents...');
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      MaxKeys: 5,
    });

    const listResponse = await s3Client.send(listCommand);
    console.log(`✓ Successfully accessed bucket`);
    console.log(`  Objects in bucket: ${listResponse.KeyCount || 0}\n`);

    // Test 2: Upload a test file
    console.log('Test 2: Uploading test file...');
    const testContent = `Test upload at ${new Date().toISOString()}`;
    const testKey = `test-uploads/test-${Date.now()}.txt`;

    const putCommand = new PutObjectCommand({
      Bucket: bucketName,
      Key: testKey,
      Body: testContent,
      ContentType: 'text/plain',
    });

    await s3Client.send(putCommand);
    console.log(`✓ Successfully uploaded test file`);
    console.log(`  Key: ${testKey}\n`);

    // Show public URL
    const publicDomain = process.env.R2_PUBLIC_DOMAIN || `https://pub-${accountId}.r2.dev`;
    const publicUrl = `${publicDomain}/${testKey}`;
    console.log('Public URL (if bucket is public):');
    console.log(`  ${publicUrl}\n`);

    console.log('✅ All R2 tests PASSED');
    console.log('\nYou can now use R2 for Rendi integration!');
    console.log('Next step: Test full reel generation with:');
    console.log('  curl -X POST http://localhost:3000/api/generate-reel-cloud\n');

    return true;
  } catch (error) {
    console.error('\n❌ R2 test FAILED:', error.message);
    
    if (error.Code === 'NoSuchBucket') {
      console.error('\nThe bucket does not exist or is not accessible.');
      console.error('Please verify:');
      console.error('  1. Bucket name is correct');
      console.error('  2. Bucket exists in your R2 account');
      console.error('  3. API token has access to this bucket');
    } else if (error.Code === 'InvalidAccessKeyId') {
      console.error('\nInvalid access key ID.');
      console.error('Please verify your R2_ACCESS_KEY_ID is correct.');
    } else if (error.Code === 'SignatureDoesNotMatch') {
      console.error('\nInvalid secret access key.');
      console.error('Please verify your R2_SECRET_ACCESS_KEY is correct.');
    }

    process.exit(1);
  }
}

testR2Connection();
