# Reel Generator

An Instagram reel generator that creates two types of content:
1. **Coding Challenge Reels** - Interactive coding snippets with "What Is The Output?" prompts
2. **Read Caption Reels** - Text-based reels with AI-generated captions and hooks

## Prerequisites

Before running this project, ensure you have:

- **Node.js** (v18 or higher recommended)
- **FFmpeg** installed and available in your system PATH
  - Windows: Download from [ffmpeg.org](https://ffmpeg.org/download.html) or use `winget install ffmpeg`
  - macOS: `brew install ffmpeg`
  - Linux: `sudo apt install ffmpeg` (Ubuntu/Debian) or `sudo yum install ffmpeg` (CentOS/RHEL)
- **OpenAI API Key** - Required for AI-generated content

## Installation

1. **Clone or navigate to the project directory:**
   ```bash
   cd reel-generator
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory:
   ```env
   OPENAI_API_KEY=your_openai_api_key_here
   ```

## Required Files

Make sure you have the following files/folders in your project:

- `bRoll.MOV` - Background video file (required for both scripts)
- `audio/` folder - Contains audio files (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, `.flac`)
  - At least one audio file must be present
- `Inter.ttf` - Font file (required for `generateReadCaptionReel.js`)

## Usage

### 1. Generate Coding Challenge Reel

Creates a reel with a JavaScript code snippet asking "What Is The Output?"

```bash
node generateCodingChallengeReel.js
```


### 2. Generate Read Caption Reel

Creates a text-based reel with AI-generated hooks and captions.

```bash
node generateReadCaptionReel.js
```


## Dependencies

- **ai** - AI SDK for generating text and objects
- **@ai-sdk/openai** - OpenAI provider for AI SDK
- **puppeteer** - Browser automation for rendering code snippets
- **fluent-ffmpeg** - Video processing and manipulation
- **dotenv** - Environment variable management
- **zod** - Schema validation for AI responses
- **shiki** - Syntax highlighting for code snippets

## Configuration

You can modify settings in `constants.js`:

- Video dimensions (default: 1080x1920)
- Video duration
- Font settings
- B-roll path
- Audio folder path
- AI prompts and templates