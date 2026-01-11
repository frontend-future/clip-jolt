export type CodingSnippet = {
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  code: string;
  caption: string;
};

export type CodingChallengeResult = {
  outputDir: string;
  videoPath: string;
  captionPath: string;
  imagePath: string;
  bRollSegmentPath: string;
  audioPath: string;
  snippet: CodingSnippet;
};

export type ReadCaptionResult = {
  outputFolder: string;
  videoPath: string;
  captionPath: string;
  hook: string;
  caption: string;
  cta: string;
};

export type GenerateResponse<T> = {
  success: boolean;
  message?: string;
  error?: string;
  data?: T & {
    videoUrl: string;
    captionUrl: string;
    imageUrl?: string;
  };
};

export type ReelDefaults = {
  theme: string;
  width: number;
  height: number;
  padding: number;
  font: string;
  background: string;
  scale: number;
  fontSize: number;
  videoDuration: number;
  bRollPath: string;
  audioFolder: string;
  fontPath: string;
  outputDir: string;
  levelAppearTime: number;
};
