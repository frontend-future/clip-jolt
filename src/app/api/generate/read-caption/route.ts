import path from 'node:path';

import { NextResponse } from 'next/server';

import type { GenerateResponse, ReadCaptionResult } from '@/lib/reel-generator';
import { generateReadCaptionReel } from '@/lib/reel-generator';

// Increase timeout for video generation (5 minutes)
export const maxDuration = 300;

function pathToUrl(filePath: string): string {
  const publicDir = path.join(process.cwd(), 'public');
  const relativePath = filePath.replace(publicDir, '');
  return relativePath.replace(/\\/g, '/');
}

export async function POST(): Promise<NextResponse<GenerateResponse<ReadCaptionResult>>> {
  try {
    const result = await generateReadCaptionReel();

    return NextResponse.json({
      success: true,
      message: 'Read caption reel generated successfully',
      data: {
        outputFolder: pathToUrl(result.outputFolder),
        videoPath: pathToUrl(result.videoPath),
        videoUrl: pathToUrl(result.videoPath),
        captionPath: pathToUrl(result.captionPath),
        captionUrl: pathToUrl(result.captionPath),
        hook: result.hook,
        caption: result.caption,
        cta: result.cta,
      },
    });
  } catch (error) {
    console.error('Error generating read caption reel:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate read caption reel',
      },
      { status: 500 },
    );
  }
}
