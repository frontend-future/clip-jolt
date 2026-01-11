import { NextResponse } from 'next/server';

import { RendiService } from '@/lib/rendi';

/**
 * Test endpoint for Rendi integration
 * Tests basic API connectivity and command submission
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/test-rendi
 */
export async function POST() {
  try {
    const apiKey = process.env.RENDI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'RENDI_API_KEY environment variable not set' },
        { status: 500 },
      );
    }

    const rendi = new RendiService({ apiKey });

    // Test with a simple command using Rendi's sample video
    const result = await rendi.submitAndWait({
      ffmpeg_command: '-i {{in_1}} -t 3 -vf scale=640:360 {{out_1}}',
      input_files: {
        in_1: 'https://storage.rendi.dev/sample/sample.avi',
      },
      output_files: {
        out_1: 'test_output.mp4',
      },
      vcpu_count: 4,
      max_command_run_seconds: 60,
    });

    return NextResponse.json({
      success: true,
      message: 'Rendi integration test successful',
      commandId: result.command_id,
      status: result.status,
      processingTime: result.total_processing_seconds,
      ffmpegTime: result.ffmpeg_command_run_seconds,
      outputUrl: result.output_files?.out_1?.storage_url,
    });
  } catch (error) {
    console.error('Rendi test failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
