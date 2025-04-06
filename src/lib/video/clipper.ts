import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { Segment } from './detector';

/**
 * Interface for clip options
 */
export interface ClipOptions {
  outputDir: string;
  format: 'mp4' | 'mov' | 'gif';
  width?: number;
  height?: number;
  fps?: number;
  addWatermark?: boolean;
  watermarkText?: string;
  watermarkPosition?: 'top' | 'bottom';
}

/**
 * Interface for clip result
 */
export interface ClipResult {
  inputPath: string;
  outputPath: string;
  segment: Segment;
  duration: number;
  success: boolean;
  error?: string;
}

/**
 * Class for clipping videos and creating reels
 */
export class VideoClipper {
  private options: ClipOptions;

  /**
   * Constructor for VideoClipper
   * @param options Clip options
   */
  constructor(options: Partial<ClipOptions> = {}) {
    this.options = {
      outputDir: options.outputDir || path.join(process.cwd(), 'clips'),
      format: options.format || 'mp4',
      width: options.width || 1080,
      height: options.height || 1920, // 9:16 aspect ratio for reels
      fps: options.fps || 30,
      addWatermark: options.addWatermark || false,
      watermarkText: options.watermarkText || '',
      watermarkPosition: options.watermarkPosition || 'bottom'
    };

    // Create output directory if it doesn't exist
    if (!fs.existsSync(this.options.outputDir)) {
      fs.mkdirSync(this.options.outputDir, { recursive: true });
    }
  }

  /**
   * Clips a segment from a video
   * @param videoPath Path to the input video
   * @param segment Segment to clip
   * @param outputFilename Optional custom filename for the output
   * @returns Promise with clip result
   */
  public async clipSegment(
    videoPath: string,
    segment: Segment,
    outputFilename?: string
  ): Promise<ClipResult> {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      const duration = segment.end - segment.start;
      
      // Generate output filename if not provided
      const baseFilename = outputFilename || 
        `clip_${Math.floor(segment.start)}_${Math.floor(segment.end)}_${Date.now()}`;
      
      const outputPath = path.join(
        this.options.outputDir, 
        `${baseFilename}.${this.options.format}`
      );

      // Create ffmpeg command
      let command = ffmpeg(videoPath)
        .setStartTime(segment.start)
        .setDuration(duration)
        .size(`${this.options.width}x${this.options.height}`)
        .fps(this.options.fps || 30)
        .autopad(true, 'black');

      // Add watermark if enabled
      if (this.options.addWatermark && this.options.watermarkText) {
        const position = this.options.watermarkPosition === 'top' ? 
          'main_w/2-text_w/2:10' : 
          'main_w/2-text_w/2:main_h-text_h-10';
        
        command = command.videoFilters([
          {
            filter: 'drawtext',
            options: {
              text: this.options.watermarkText,
              fontsize: 24,
              fontcolor: 'white',
              x: position.split(':')[0],
              y: position.split(':')[1],
              shadowcolor: 'black',
              shadowx: 2,
              shadowy: 2
            }
          }
        ]);
      }

      // Process the clip
      return new Promise((resolve, reject) => {
        command
          .output(outputPath)
          .on('end', () => {
            resolve({
              inputPath: videoPath,
              outputPath,
              segment,
              duration,
              success: true
            });
          })
          .on('error', (err) => {
            resolve({
              inputPath: videoPath,
              outputPath,
              segment,
              duration,
              success: false,
              error: err.message
            });
          })
          .run();
      });
    } catch (error: any) {
      return {
        inputPath: videoPath,
        outputPath: '',
        segment,
        duration: segment.end - segment.start,
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Clips multiple segments from a video
   * @param videoPath Path to the input video
   * @param segments Segments to clip
   * @param baseFilename Base filename for the output clips
   * @returns Promise with array of clip results
   */
  public async clipMultipleSegments(
    videoPath: string,
    segments: Segment[],
    baseFilename?: string
  ): Promise<ClipResult[]> {
    const results: ClipResult[] = [];
    
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];
      const outputFilename = baseFilename ? 
        `${baseFilename}_part${i+1}` : 
        undefined;
      
      const result = await this.clipSegment(videoPath, segment, outputFilename);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Creates a compilation of multiple clips
   * @param clipPaths Paths to the clips to combine
   * @param outputFilename Filename for the output compilation
   * @returns Promise with path to the compilation
   */
  public async createCompilation(
    clipPaths: string[],
    outputFilename: string
  ): Promise<string | null> {
    try {
      if (clipPaths.length === 0) {
        throw new Error('No clips provided for compilation');
      }

      // Verify all clips exist
      for (const clipPath of clipPaths) {
        if (!fs.existsSync(clipPath)) {
          throw new Error(`Clip file not found: ${clipPath}`);
        }
      }

      // Create temporary file with list of clips
      const listFilePath = path.join(this.options.outputDir, 'clips_list.txt');
      const listContent = clipPaths.map(clip => `file '${clip}'`).join('\n');
      fs.writeFileSync(listFilePath, listContent);

      // Set output path
      const outputPath = path.join(
        this.options.outputDir,
        `${outputFilename}.${this.options.format}`
      );

      // Create compilation using ffmpeg concat
      return new Promise((resolve, reject) => {
        ffmpeg()
          .input(listFilePath)
          .inputOptions(['-f', 'concat', '-safe', '0'])
          .output(outputPath)
          .outputOptions('-c copy')
          .on('end', () => {
            // Clean up temporary file
            fs.unlinkSync(listFilePath);
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Error creating compilation:', err);
            // Clean up temporary file
            if (fs.existsSync(listFilePath)) {
              fs.unlinkSync(listFilePath);
            }
            reject(err);
          })
          .run();
      });
    } catch (error) {
      console.error('Error in compilation process:', error);
      return null;
    }
  }

  /**
   * Adds music to a video clip
   * @param videoPath Path to the video clip
   * @param audioPath Path to the audio file
   * @param outputFilename Filename for the output video
   * @param volume Volume level for the audio (0.0 to 1.0)
   * @returns Promise with path to the output video
   */
  public async addMusicToClip(
    videoPath: string,
    audioPath: string,
    outputFilename: string,
    volume: number = 0.5
  ): Promise<string | null> {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      if (!fs.existsSync(audioPath)) {
        throw new Error(`Audio file not found: ${audioPath}`);
      }

      // Set output path
      const outputPath = path.join(
        this.options.outputDir,
        `${outputFilename}.${this.options.format}`
      );

      // Add music to clip
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .input(audioPath)
          .outputOptions([
            '-map 0:v',
            '-map 1:a',
            '-shortest',
            `-af volume=${volume}`
          ])
          .output(outputPath)
          .on('end', () => {
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Error adding music to clip:', err);
            reject(err);
          })
          .run();
      });
    } catch (error) {
      console.error('Error in add music process:', error);
      return null;
    }
  }

  /**
   * Adds text overlay to a video clip
   * @param videoPath Path to the video clip
   * @param text Text to overlay
   * @param outputFilename Filename for the output video
   * @param options Text overlay options
   * @returns Promise with path to the output video
   */
  public async addTextOverlay(
    videoPath: string,
    text: string,
    outputFilename: string,
    options: {
      fontSize?: number;
      fontColor?: string;
      position?: 'top' | 'center' | 'bottom';
      backgroundColor?: string;
    } = {}
  ): Promise<string | null> {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Set default options
      const fontSize = options.fontSize || 24;
      const fontColor = options.fontColor || 'white';
      const backgroundColor = options.backgroundColor || 'black@0.5';
      
      // Determine position
      let positionY: string;
      switch (options.position || 'bottom') {
        case 'top':
          positionY = '10';
          break;
        case 'center':
          positionY = '(h-text_h)/2';
          break;
        case 'bottom':
        default:
          positionY = 'h-text_h-10';
          break;
      }

      // Set output path
      const outputPath = path.join(
        this.options.outputDir,
        `${outputFilename}.${this.options.format}`
      );

      // Add text overlay
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .videoFilters({
            filter: 'drawtext',
            options: {
              text,
              fontsize: fontSize,
              fontcolor: fontColor,
              box: 1,
              boxcolor: backgroundColor,
              x: '(w-text_w)/2',
              y: positionY
            }
          })
          .output(outputPath)
          .on('end', () => {
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Error adding text overlay:', err);
            reject(err);
          })
          .run();
      });
    } catch (error) {
      console.error('Error in add text overlay process:', error);
      return null;
    }
  }

  /**
   * Converts a video to a GIF
   * @param videoPath Path to the video
   * @param outputFilename Filename for the output GIF
   * @param options GIF options
   * @returns Promise with path to the output GIF
   */
  public async convertToGif(
    videoPath: string,
    outputFilename: string,
    options: {
      width?: number;
      height?: number;
      fps?: number;
    } = {}
  ): Promise<string | null> {
    try {
      if (!fs.existsSync(videoPath)) {
        throw new Error(`Video file not found: ${videoPath}`);
      }

      // Set output path
      const outputPath = path.join(
        this.options.outputDir,
        `${outputFilename}.gif`
      );

      // Convert to GIF
      return new Promise((resolve, reject) => {
        ffmpeg(videoPath)
          .size(`${options.width || 480}x${options.height || 854}`)
          .fps(options.fps || 15)
          .output(outputPath)
          .on('end', () => {
            resolve(outputPath);
          })
          .on('error', (err) => {
            console.error('Error converting to GIF:', err);
            reject(err);
          })
          .run();
      });
    } catch (error) {
      console.error('Error in GIF conversion process:', error);
      return null;
    }
  }
}

export default VideoClipper;
