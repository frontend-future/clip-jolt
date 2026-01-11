import path from 'node:path';

import { NextResponse } from 'next/server';

import type { CodingChallengeResult, GenerateResponse } from '@/lib/reel-generator';
import { generateCodingChallengeReelCloud } from '@/lib/reel-generator/generateCodingChallengeReelCloud';

// Increase timeout for video generation (5 minutes)
export const maxDuration = 300;

function pathToUrl(filePath: string): string {
  const publicDir = path.join(process.cwd(), 'public');
  const relativePath = filePath.replace(publicDir, '');
  return relativePath.replace(/\\/g, '/');
}

export async function POST(): Promise<NextResponse<GenerateResponse<CodingChallengeResult>>> {
  try {
    console.log('Starting cloud-based coding challenge reel generation...');
    const result = await generateCodingChallengeReelCloud();

    return NextResponse.json({
      success: true,
      message: 'Coding challenge reel generated successfully (cloud)',
      data: {
        outputDir: pathToUrl(result.outputDir),
        videoPath: pathToUrl(result.videoPath),
        videoUrl: pathToUrl(result.videoPath),
        captionPath: pathToUrl(result.captionPath),
        captionUrl: pathToUrl(result.captionPath),
        imagePath: pathToUrl(result.imagePath),
        imageUrl: pathToUrl(result.imagePath),
        bRollSegmentPath: result.bRollSegmentPath || '',
        audioPath: result.audioPath || '',
        snippet: result.snippet,
      },
    });
  } catch (error) {
    console.error('Error generating coding challenge reel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate coding challenge reel',
      },
      { status: 500 },
    );
  }
}
