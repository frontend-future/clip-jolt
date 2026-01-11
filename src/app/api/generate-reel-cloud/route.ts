import { NextResponse } from 'next/server';

import { generateCodingChallengeReelCloud } from '@/lib/reel-generator/generateCodingChallengeReelCloud';

/**
 * API endpoint to test cloud-based reel generation
 * Uses Rendi for video processing instead of local FFmpeg
 *
 * Usage:
 * curl -X POST http://localhost:3000/api/generate-reel-cloud
 */
export async function POST() {
  try {
    console.log('Starting cloud reel generation...');

    const result = await generateCodingChallengeReelCloud();

    return NextResponse.json({
      success: true,
      message: 'Cloud reel generated successfully',
      result: {
        outputDir: result.outputDir,
        videoPath: result.videoPath,
        captionPath: result.captionPath,
        difficulty: result.snippet.difficulty,
        code: result.snippet.code,
        caption: result.snippet.caption,
      },
    });
  } catch (error) {
    console.error('Cloud reel generation failed:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    );
  }
}
