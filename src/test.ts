import { YouTubeFetcher } from '@/lib/youtube/fetcher';
import { ViralContentDetector } from '@/lib/video/detector';
import { VideoClipper } from '@/lib/video/clipper';
import fs from 'fs';
import path from 'path';

// Create directories for testing
const downloadDir = path.join(process.cwd(), 'downloads');
const clipsDir = path.join(process.cwd(), 'clips');

if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

if (!fs.existsSync(clipsDir)) {
  fs.mkdirSync(clipsDir, { recursive: true });
}

// Initialize services
const youtubeService = new YouTubeFetcher(downloadDir);
const detectorService = new ViralContentDetector();
const clipperService = new VideoClipper({
  outputDir: clipsDir,
  format: 'mp4',
  width: 1080,
  height: 1920
});

// Test YouTube URL validation
async function testUrlValidation() {
  console.log('Testing URL validation...');
  
  const validUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
  const invalidUrl = 'https://example.com/video';
  
  console.log(`Valid URL (${validUrl}): ${youtubeService.isValidYouTubeUrl(validUrl)}`);
  console.log(`Invalid URL (${invalidUrl}): ${youtubeService.isValidYouTubeUrl(invalidUrl)}`);
}

// Test fetching video info
async function testVideoInfo() {
  console.log('\nTesting video info fetching...');
  
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    const info = await youtubeService.getVideoInfo(videoUrl);
    
    if (info) {
      console.log('Successfully fetched video info:');
      console.log(`- Title: ${info.title}`);
      console.log(`- Channel: ${info.channelTitle}`);
      console.log(`- Duration: ${info.duration} seconds`);
      console.log(`- Views: ${info.viewCount}`);
    } else {
      console.log('Failed to fetch video info');
    }
  } catch (error) {
    console.error('Error in video info test:', error);
  }
}

// Test downloading a video
async function testVideoDownload() {
  console.log('\nTesting video download...');
  
  try {
    const videoUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
    console.log(`Downloading video: ${videoUrl}`);
    
    const videoPath = await youtubeService.downloadVideo(videoUrl, {
      format: 'mp4',
      quality: 'highest',
      filename: 'test_video'
    });
    
    if (videoPath) {
      console.log(`Successfully downloaded video to: ${videoPath}`);
      return videoPath;
    } else {
      console.log('Failed to download video');
      return null;
    }
  } catch (error) {
    console.error('Error in video download test:', error);
    return null;
  }
}

// Test viral content detection
async function testViralDetection(videoPath: string) {
  console.log('\nTesting viral content detection...');
  
  try {
    if (!videoPath) {
      console.log('No video path provided for detection test');
      return null;
    }
    
    console.log(`Detecting viral segments in: ${videoPath}`);
    const segments = await detectorService.detectViralSegments(videoPath);
    
    if (segments.length > 0) {
      console.log(`Detected ${segments.length} viral segments:`);
      segments.forEach((segment, index) => {
        console.log(`Segment ${index + 1}:`);
        console.log(`- Start: ${segment.start.toFixed(2)}s`);
        console.log(`- End: ${segment.end.toFixed(2)}s`);
        console.log(`- Duration: ${(segment.end - segment.start).toFixed(2)}s`);
        console.log(`- Score: ${(segment.score * 100).toFixed(2)}%`);
        console.log(`- Type: ${segment.type}`);
      });
      
      return segments;
    } else {
      console.log('No viral segments detected');
      return null;
    }
  } catch (error) {
    console.error('Error in viral detection test:', error);
    return null;
  }
}

// Test video clipping
async function testVideoClipping(videoPath: string, segments: any[]) {
  console.log('\nTesting video clipping...');
  
  try {
    if (!videoPath || !segments || segments.length === 0) {
      console.log('No video path or segments provided for clipping test');
      return;
    }
    
    console.log(`Clipping segments from: ${videoPath}`);
    const results = await clipperService.clipMultipleSegments(
      videoPath,
      segments,
      'test_clip'
    );
    
    if (results.length > 0) {
      console.log(`Generated ${results.length} clips:`);
      results.forEach((result, index) => {
        console.log(`Clip ${index + 1}:`);
        console.log(`- Output: ${result.outputPath}`);
        console.log(`- Duration: ${result.duration.toFixed(2)}s`);
        console.log(`- Success: ${result.success}`);
        if (!result.success && result.error) {
          console.log(`- Error: ${result.error}`);
        }
      });
    } else {
      console.log('No clips were generated');
    }
  } catch (error) {
    console.error('Error in video clipping test:', error);
  }
}

// Run all tests
async function runTests() {
  console.log('Starting YouTube Podcast Clipper tests...\n');
  
  await testUrlValidation();
  await testVideoInfo();
  
  const videoPath = await testVideoDownload();
  if (videoPath) {
    const segments = await testViralDetection(videoPath);
    if (segments && segments.length > 0) {
      await testVideoClipping(videoPath, segments);
    }
  }
  
  console.log('\nAll tests completed!');
}

// Execute tests
runTests().catch(console.error);
