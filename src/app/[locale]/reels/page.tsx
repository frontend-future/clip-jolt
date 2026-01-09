'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check } from 'lucide-react';

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
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(key);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setError('Failed to copy to clipboard');
    }
  };

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
      <h1 className="text-3xl font-bold mb-8">Reels</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="flex flex-col gap-4 max-w-md mb-8">
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
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Read Caption Reel</h2>
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
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Hook:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(readCaptionReel.hook, 'read-hook')}
                    className="flex items-center gap-2"
                  >
                    {copiedText === 'read-hook' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-gray-700">{readCaptionReel.hook}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Caption:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(readCaptionReel.caption, 'read-caption')}
                    className="flex items-center gap-2"
                  >
                    {copiedText === 'read-caption' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{readCaptionReel.caption}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">CTA:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(readCaptionReel.cta, 'read-cta')}
                    className="flex items-center gap-2"
                  >
                    {copiedText === 'read-cta' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-gray-700">{readCaptionReel.cta}</p>
              </div>
              <div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const fullCaption = `${readCaptionReel.hook}\n\n${readCaptionReel.caption}\n\n${readCaptionReel.cta}`;
                    copyToClipboard(fullCaption, 'read-full');
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  {copiedText === 'read-full' ? (
                    <>
                      <Check className="h-4 w-4" />
                      Full Caption Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Full Caption
                    </>
                  )}
                </Button>
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
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Coding Challenge Reel</h2>
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
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Difficulty:</h3>
                <p className="text-gray-700">{codingChallengeReel.snippet.difficulty}</p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Code:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(codingChallengeReel.snippet.code, 'coding-code')}
                    className="flex items-center gap-2"
                  >
                    {copiedText === 'coding-code' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <pre className="bg-gray-800 text-green-400 p-4 rounded overflow-x-auto">
                  <code>{codingChallengeReel.snippet.code}</code>
                </pre>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg">Caption:</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(codingChallengeReel.snippet.caption, 'coding-caption')}
                    className="flex items-center gap-2"
                  >
                    {copiedText === 'coding-caption' ? (
                      <>
                        <Check className="h-4 w-4" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-gray-700 whitespace-pre-wrap">{codingChallengeReel.snippet.caption}</p>
              </div>
              <div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => {
                    const fullCaption = `${codingChallengeReel.snippet.caption}\n\n${codingChallengeReel.snippet.code}`;
                    copyToClipboard(fullCaption, 'coding-full');
                  }}
                  className="flex items-center gap-2 w-full"
                >
                  {copiedText === 'coding-full' ? (
                    <>
                      <Check className="h-4 w-4" />
                      Full Caption Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy Full Caption (Caption + Code)
                    </>
                  )}
                </Button>
              </div>
              <div className="pt-2 flex gap-4">
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
