// Simple test script for Rendi integration
const apiKey = process.env.RENDI_API_KEY || 'eJwzSTMxM0o1t6NA1tjRK0TWxME3VtTBNS9RNSUlKS7IwszA3MrSIz03yTPMs8zLKLjQMCTUqyix0z/fxLgcA4iIRbw==';

async function testRendi() {
  console.log('Testing Rendi API integration...\n');

  // Step 1: Submit command
  console.log('Step 1: Submitting FFmpeg command...');
  const submitResponse = await fetch('https://api.rendi.dev/v1/run-ffmpeg-command', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    body: JSON.stringify({
      ffmpeg_command: '-i {{in_1}} -t 3 -vf scale=640:360 {{out_1}}',
      input_files: {
        in_1: 'https://storage.rendi.dev/sample/sample.avi',
      },
      output_files: {
        out_1: 'test_output.mp4',
      },
      vcpu_count: 4,
      max_command_run_seconds: 60,
    }),
  });

  if (!submitResponse.ok) {
    const error = await submitResponse.text();
    throw new Error(`Failed to submit: ${error}`);
  }

  const { command_id } = await submitResponse.json();
  console.log(`✓ Command submitted: ${command_id}\n`);

  // Step 2: Poll for completion
  console.log('Step 2: Polling for completion...');
  let attempts = 0;
  const maxAttempts = 60;

  while (attempts < maxAttempts) {
    attempts++;
    
    await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds

    const pollResponse = await fetch(`https://api.rendi.dev/v1/commands/${command_id}`, {
      method: 'GET',
      headers: {
        'X-API-KEY': apiKey,
      },
    });

    if (!pollResponse.ok) {
      const error = await pollResponse.text();
      throw new Error(`Failed to poll: ${error}`);
    }

    const status = await pollResponse.json();
    console.log(`  [${attempts}] Status: ${status.status} ${status.processing_stage || ''}`);

    if (status.status === 'SUCCESS') {
      console.log('\n✓ Processing complete!');
      console.log(`  Processing time: ${status.total_processing_seconds}s`);
      console.log(`  FFmpeg time: ${status.ffmpeg_command_run_seconds}s`);
      console.log(`  Output URL: ${status.output_files.out_1.storage_url}`);
      console.log(`  File size: ${status.output_files.out_1.size_mbytes.toFixed(2)} MB`);
      return status;
    }

    if (status.status === 'FAILED') {
      throw new Error(`Processing failed: ${status.error_message}`);
    }
  }

  throw new Error('Polling timeout');
}

testRendi()
  .then(() => {
    console.log('\n✅ Rendi integration test PASSED');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Rendi integration test FAILED:', error.message);
    process.exit(1);
  });
