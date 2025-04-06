# YouTube Podcast Clipper

A Next.js application that takes YouTube podcasts and automatically detects viral sections to generate reels.

## Features

- YouTube video fetching and downloading
- Automatic viral content detection
- Video clipping and reel generation
- Modern responsive UI built with Next.js and TypeScript

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- FFmpeg installed on your system

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/youtube-clipper-app.git
cd youtube-clipper-app
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

## Usage

1. Enter a YouTube podcast URL in the input field
2. Click "Fetch Info" to retrieve video information
3. Click "Download and Analyze" to process the video
4. Select viral segments from the detected list
5. Click "Generate Clips" to create reels from selected segments
6. Download the generated clips

## Technical Details

The application is built with:
- Next.js 14+ with TypeScript
- Tailwind CSS for styling
- ytdl-core for YouTube video processing
- FFmpeg for video manipulation

## Project Structure

- `src/app/` - Next.js pages and routing
- `src/lib/youtube/` - YouTube video fetching functionality
- `src/lib/video/` - Video processing and clipping functionality
- `downloads/` - Directory for downloaded videos
- `clips/` - Directory for generated clips

## License

This project is licensed under the MIT License - see the LICENSE file for details.
