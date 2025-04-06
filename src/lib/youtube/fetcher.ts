import ytdl from 'ytdl-core';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

/**
 * Interface for YouTube video information
 */
export interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  duration: number;
  thumbnailUrl: string;
  channelTitle: string;
  publishDate: string;
  viewCount: number;
}

/**
 * Class for fetching and downloading YouTube videos
 */
export class YouTubeFetcher {
  private outputDir: string;

  /**
   * Constructor for YouTubeFetcher
   * @param outputDir Directory to save downloaded videos
   */
  constructor(outputDir: string = path.join(process.cwd(), 'downloads')) {
    this.outputDir = outputDir;
    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Validates if a string is a valid YouTube URL
   * @param url URL to validate
   * @returns Boolean indicating if URL is valid
   */
  public isValidYouTubeUrl(url: string): boolean {
    return ytdl.validateURL(url);
  }

  /**
   * Extracts video ID from YouTube URL
   * @param url YouTube URL
   * @returns Video ID or null if invalid
   */
  public getVideoId(url: string): string | null {
    try {
      return ytdl.getVideoID(url);
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  }

  /**
   * Gets information about a YouTube video
   * @param videoUrl YouTube video URL
   * @returns Promise with video information
   */
  public async getVideoInfo(videoUrl: string): Promise<VideoInfo | null> {
    try {
      if (!this.isValidYouTubeUrl(videoUrl)) {
        throw new Error('Invalid YouTube URL');
      }

      const info = await ytdl.getInfo(videoUrl);
      const videoDetails = info.videoDetails;

      return {
        videoId: videoDetails.videoId,
        title: videoDetails.title,
        description: videoDetails.description || '',
        duration: parseInt(videoDetails.lengthSeconds),
        thumbnailUrl: videoDetails.thumbnails[0].url,
        channelTitle: videoDetails.author.name,
        publishDate: videoDetails.publishDate || '',
        viewCount: parseInt(videoDetails.viewCount) || 0
      };
    } catch (error) {
      console.error('Error fetching video info:', error);
      return null;
    }
  }

  /**
   * Downloads a YouTube video
   * @param videoUrl YouTube video URL
   * @param options Optional download options
   * @returns Promise with the path to the downloaded file
   */
  public async downloadVideo(
    videoUrl: string, 
    options: { 
      format?: 'mp4' | 'mp3', 
      quality?: 'highest' | 'lowest' | 'audio' | 'video',
      filename?: string
    } = {}
  ): Promise<string | null> {
    try {
      if (!this.isValidYouTubeUrl(videoUrl)) {
        throw new Error('Invalid YouTube URL');
      }

      const videoId = this.getVideoId(videoUrl);
      if (!videoId) {
        throw new Error('Could not extract video ID');
      }

      const info = await ytdl.getInfo(videoUrl);
      const videoDetails = info.videoDetails;
      
      // Determine filename
      const sanitizedTitle = options.filename || 
        videoDetails.title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_');
      
      const format = options.format || 'mp4';
      const outputPath = path.join(this.outputDir, `${sanitizedTitle}.${format}`);

      // Set up download options based on format and quality
      const downloadOptions: ytdl.downloadOptions = {
        quality: options.quality === 'audio' ? 'highestaudio' : 'highest'
      };

      if (format === 'mp3') {
        downloadOptions.filter = 'audioonly';
      }

      // Create write stream
      const outputStream = fs.createWriteStream(outputPath);
      
      // Download the video
      return new Promise((resolve, reject) => {
        ytdl(videoUrl, downloadOptions)
          .pipe(outputStream)
          .on('finish', () => {
            console.log(`Downloaded: ${outputPath}`);
            resolve(outputPath);
          })
          .on('error', (error) => {
            console.error('Error downloading video:', error);
            reject(error);
          });
      });
    } catch (error) {
      console.error('Error in download process:', error);
      return null;
    }
  }

  /**
   * Gets available formats for a YouTube video
   * @param videoUrl YouTube video URL
   * @returns Promise with available formats
   */
  public async getAvailableFormats(videoUrl: string): Promise<ytdl.videoFormat[]> {
    try {
      const info = await ytdl.getInfo(videoUrl);
      return info.formats;
    } catch (error) {
      console.error('Error getting formats:', error);
      return [];
    }
  }

  /**
   * Searches for YouTube videos using the YouTube Data API
   * Note: This requires a YouTube API key to be set
   * @param query Search query
   * @param apiKey YouTube Data API key
   * @param maxResults Maximum number of results to return
   * @returns Promise with search results
   */
  public async searchVideos(
    query: string, 
    apiKey: string,
    maxResults: number = 10
  ): Promise<any[]> {
    try {
      const response = await axios.get(
        'https://www.googleapis.com/youtube/v3/search',
        {
          params: {
            part: 'snippet',
            q: query,
            key: apiKey,
            maxResults,
            type: 'video'
          }
        }
      );

      return response.data.items;
    } catch (error) {
      console.error('Error searching videos:', error);
      return [];
    }
  }
}

export default YouTubeFetcher;
