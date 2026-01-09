'use client';

import React, { useState } from 'react';

import { Button } from '@/components/ui/button';

type ReadCaptionReelData = {
  outputFolder: string;
  videoPath: string;
  videoUrl: string;
  captionPath: string;
  captionUrl: string;
  hook: string;
  caption: string;
  cta: string;
};

type CodingChallengeReelData = {
  outputDir: string;
  videoPath: string;
  videoUrl: string;
  captionPath: string;
  captionUrl: string;
  imagePath: string;
  imageUrl: string;
  snippet: {
    difficulty: string;
    code: string;
    caption: string;
  };
};

const Reels = () => {
  const [loadingReadCaption, setLoadingReadCaption] = useState(false);
  const [loadingCodingChallenge, setLoadingCodingChallenge] = useState(false);
  const [readCaptionReel, setReadCaptionReel] = useState<ReadCaptionReelData | null>(null);
  const [codingChallengeReel, setCodingChallengeReel] = useState<CodingChallengeReelData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateReadCaptionReel = async () => {
    setLoadingReadCaption(true);
    setError(null);
    setReadCaptionReel(null);
    try {
      const response = await fetch('/api/generate/read-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setReadCaptionReel(data.data);
      } else {
        setError(data.error || 'Failed to generate read caption reel');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating read caption reel');
    } finally {
      setLoadingReadCaption(false);
    }
  };

  const handleGenerateCodingChallengeReel = async () => {
    setLoadingCodingChallenge(true);
    setError(null);
    setCodingChallengeReel(null);
    try {
      const response = await fetch('/api/generate/coding-challenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.success) {
        setCodingChallengeReel(data.data);
      } else {
        setError(data.error || 'Failed to generate coding challenge reel');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Error generating coding challenge reel');
    } finally {
      setLoadingCodingChallenge(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Reels</h1>

      {error && (
        <div className="mb-4 rounded border border-red-400 bg-red-100 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="mb-8 flex max-w-md flex-col gap-4">
        <Button
          onClick={handleGenerateReadCaptionReel}
          disabled={loadingReadCaption || loadingCodingChallenge}
          size="lg"
        >
          {loadingReadCaption ? 'Generating...' : 'Generate Read Caption Reel'}
        </Button>
        <Button
          onClick={handleGenerateCodingChallengeReel}
          disabled={loadingReadCaption || loadingCodingChallenge}
          size="lg"
        >
          {loadingCodingChallenge ? 'Generating...' : 'Generate Coding Challenge reel'}
        </Button>
      </div>

      {/* Read Caption Reel Display */}
      {readCaptionReel && (
        <div className="mt-8 rounded-lg bg-gray-50 p-6">
          <h2 className="mb-4 text-2xl font-bold">Read Caption Reel</h2>
          <div className="flex flex-col gap-4">
            <div className="w-full max-w-md">
              <video
                src={readCaptionReel.videoUrl}
                controls
                className="w-full rounded-lg shadow-lg"
                style={{ maxHeight: '600px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-semibold">Hook:</h3>
                <p className="text-gray-700">{readCaptionReel.hook}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Caption:</h3>
                <p className="text-gray-700">{readCaptionReel.caption}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">CTA:</h3>
                <p className="text-gray-700">{readCaptionReel.cta}</p>
              </div>
              <div className="pt-2">
                <a
                  href={readCaptionReel.videoUrl}
                  download={readCaptionReel.caption}
                  className="text-blue-600 hover:underline"
                >
                  Download Video
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Coding Challenge Reel Display */}
      {codingChallengeReel && (
        <div className="mt-8 rounded-lg bg-gray-50 p-6">
          <h2 className="mb-4 text-2xl font-bold">Coding Challenge Reel</h2>
          <div className="flex flex-col gap-4">
            <div className="w-full max-w-md">
              <video
                src={codingChallengeReel.videoUrl}
                controls
                className="w-full rounded-lg shadow-lg"
                style={{ maxHeight: '600px' }}
              >
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-semibold">Difficulty:</h3>
                <p className="text-gray-700">{codingChallengeReel.snippet.difficulty}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Code:</h3>
                <pre className="overflow-x-auto rounded bg-gray-800 p-4 text-green-400">
                  <code>{codingChallengeReel.snippet.code}</code>
                </pre>
              </div>
              <div>
                <h3 className="text-lg font-semibold">Caption:</h3>
                <p className="text-gray-700">{codingChallengeReel.snippet.caption}</p>
              </div>
              <div className="flex gap-4 pt-2">
                <a
                  href={codingChallengeReel.videoUrl}
                  download={codingChallengeReel.outputDir}
                  className="text-blue-600 hover:underline"
                >
                  Download Video
                </a>
                {codingChallengeReel.imageUrl && (
                  <a
                    href={codingChallengeReel.imageUrl}
                    download
                    className="text-blue-600 hover:underline"
                  >
                    Download Image
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;
