/**
 * Example usage of Rendi integration
 * This file demonstrates how to use the Rendi services
 *
 * To test this integration:
 * 1. Set RENDI_API_KEY environment variable
 * 2. Ensure you have publicly accessible URLs for input files
 * 3. Run this file with ts-node or similar
 */

import { RendiService, RendiVideoOperations } from './index';

// Example 1: Basic Rendi Service Usage
async function exampleBasicUsage() {
  const rendiService = new RendiService({
    apiKey: process.env.RENDI_API_KEY || '',
  });

  // Submit a simple command
  const commandId = await rendiService.submitCommand({
    ffmpeg_command: '-i {{in_1}} -vf scale=1080:1920 {{out_1}}',
    input_files: {
      in_1: 'https://storage.rendi.dev/sample/sample.avi', // Example public URL
    },
    output_files: {
      out_1: 'output.mp4',
    },
    vcpu_count: 4,
  });

  console.log('Command submitted:', commandId);

  // Poll for status manually
  let status = await rendiService.pollCommand(commandId);
  while (status.status === 'QUEUED' || status.status === 'PROCESSING') {
    console.log('Status:', status.status, status.processing_stage);
    await new Promise(resolve => setTimeout(resolve, 5000));
    status = await rendiService.pollCommand(commandId);
  }

  if (status.status === 'SUCCESS') {
    console.log('Success! Output URL:', status.output_files?.out_1?.storage_url);
  } else {
    console.error('Failed:', status.error_message);
  }
}

// Example 2: Submit and Wait (Recommended)
async function exampleSubmitAndWait() {
  const rendiService = new RendiService({
    apiKey: process.env.RENDI_API_KEY || '',
  });

  try {
    const result = await rendiService.submitAndWait({
      ffmpeg_command: '-i {{in_1}} -vf scale=1080:1920 {{out_1}}',
      input_files: {
        in_1: 'https://storage.rendi.dev/sample/sample.avi',
      },
      output_files: {
        out_1: 'output.mp4',
      },
      vcpu_count: 4,
    });

    console.log('Processing complete!');
    console.log('Output URL:', result.output_files?.out_1?.storage_url);
    console.log('Processing time:', result.total_processing_seconds, 'seconds');

    // Download the file
    await rendiService.downloadFile(
      result.output_files!.out_1!.storage_url,
      './output.mp4',
    );
    console.log('File downloaded to ./output.mp4');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 3: High-level Video Operations
async function exampleVideoOperations() {
  const videoOps = new RendiVideoOperations({
    apiKey: process.env.RENDI_API_KEY || '',
  });

  try {
    // Extract video segment
    await videoOps.extractVideoSegment(
      'https://storage.rendi.dev/sample/sample.avi',
      './segment.mp4',
      10, // 10 seconds
      5, // Start at 5 seconds
    );
    console.log('Segment extracted to ./segment.mp4');

    // Resize and crop
    await videoOps.resizeAndCropVideo(
      'https://storage.rendi.dev/sample/sample.avi',
      './resized.mp4',
    );
    console.log('Video resized to ./resized.mp4');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Example 4: Integration with existing reel generator
async function exampleReelGeneratorIntegration() {
  // This shows how you would integrate Rendi into your existing code

  const apiKey = process.env.RENDI_API_KEY;
  if (!apiKey) {
    throw new Error('RENDI_API_KEY environment variable not set');
  }

  const videoOps = new RendiVideoOperations({ apiKey });

  // Instead of local ffmpeg operations, use Rendi:

  // OLD: await extractRandomVideoSegment(bRollPath, bRollSegmentPath, duration);
  // NEW:
  // 1. Upload bRoll video to public storage (or use existing URL)
  // 2. Call Rendi
  const bRollUrl = 'https://your-storage.com/broll.mp4'; // TODO: Upload file
  await videoOps.extractVideoSegment(
    bRollUrl,
    './broll_segment.mp4',
    7, // duration
    0, // start time (calculate random start time first)
  );

  // OLD: await overlayCodeOnVideoWithAudio(...)
  // NEW:
  const backgroundUrl = 'https://your-storage.com/background.mp4';
  const overlayUrl = 'https://your-storage.com/overlay.png';
  const audioUrl = 'https://your-storage.com/audio.mp3';

  await videoOps.overlayImageOnVideoWithAudio(
    backgroundUrl,
    overlayUrl,
    audioUrl,
    './final_reel.mp4',
    7, // duration
    'MEDIUM', // difficulty level
  );

  console.log('Reel generated successfully!');
}

// Run examples
if (require.main === module) {
  console.log('Rendi Integration Examples');
  console.log('=========================\n');

  // Uncomment to run examples:
  // exampleBasicUsage();
  // exampleSubmitAndWait();
  // exampleVideoOperations();
  // exampleReelGeneratorIntegration();

  console.log('Examples defined but not executed.');
  console.log('Uncomment the example you want to run in the code.');
}

export {
  exampleBasicUsage,
  exampleSubmitAndWait,
  exampleVideoOperations,
  exampleReelGeneratorIntegration,
};
