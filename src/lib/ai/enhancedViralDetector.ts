import { Segment } from '../video/detector';
import { Caption } from '../youtube/captionScraper';
import { AnalysisResult } from './captionAnalyzer';

/**
 * Interface for enhanced viral segment with caption analysis
 */
export interface EnhancedSegment extends Segment {
  captionText?: string;
  aiAnalysis?: AnalysisResult;
  combinedScore: number;
}

/**
 * Class for combining audio and caption analysis for improved viral detection
 */
export class EnhancedViralDetector {
  /**
   * Combines audio-based segments with caption analysis
   * @param audioSegments Segments detected from audio analysis
   * @param captionAnalysisResults Results from AI caption analysis
   * @returns Enhanced segments with combined scores
   */
  public combineAudioAndCaptionAnalysis(
    audioSegments: Segment[],
    captionAnalysisResults: Array<AnalysisResult & {caption: Caption}>
  ): EnhancedSegment[] {
    // Map to store enhanced segments
    const enhancedSegments: EnhancedSegment[] = [];
    
    // Process each audio segment
    for (const audioSegment of audioSegments) {
      // Find overlapping caption analysis results
      const overlappingCaptions = this.findOverlappingCaptions(
        audioSegment,
        captionAnalysisResults.map(result => ({
          start: result.caption.start,
          end: result.caption.start + result.caption.duration,
          analysis: result
        }))
      );
      
      if (overlappingCaptions.length > 0) {
        // Calculate average AI score from overlapping captions
        const avgAiScore = overlappingCaptions.reduce(
          (sum, caption) => sum + caption.analysis.score, 
          0
        ) / overlappingCaptions.length;
        
        // Combine all caption texts
        const combinedCaptionText = overlappingCaptions
          .map(caption => caption.analysis.caption.text)
          .join(' ');
        
        // Get the highest scoring AI analysis
        const bestAnalysis = overlappingCaptions.reduce(
          (best, current) => current.analysis.score > best.analysis.score ? current : best,
          overlappingCaptions[0]
        ).analysis;
        
        // Calculate combined score (weighted average of audio and caption scores)
        const audioWeight = 0.4;
        const captionWeight = 0.6;
        const combinedScore = (audioSegment.score * audioWeight) + (avgAiScore * captionWeight);
        
        // Create enhanced segment
        enhancedSegments.push({
          ...audioSegment,
          captionText: combinedCaptionText,
          aiAnalysis: bestAnalysis,
          combinedScore
        });
      } else {
        // No overlapping captions, use only audio score
        enhancedSegments.push({
          ...audioSegment,
          combinedScore: audioSegment.score * 0.7 // Reduce confidence without caption validation
        });
      }
    }
    
    // Add high-scoring caption segments that don't overlap with audio segments
    for (const captionResult of captionAnalysisResults) {
      // Only consider high-scoring captions (threshold can be adjusted)
      if (captionResult.score < 0.7) continue;
      
      const captionSegment = {
        start: captionResult.caption.start,
        end: captionResult.caption.start + captionResult.caption.duration,
        analysis: captionResult
      };
      
      // Check if this caption overlaps with any existing enhanced segment
      const hasOverlap = enhancedSegments.some(segment => 
        this.segmentsOverlap(
          { start: segment.start, end: segment.end },
          { start: captionSegment.start, end: captionSegment.end }
        )
      );
      
      // If no overlap and high score, add as a new segment
      if (!hasOverlap) {
        enhancedSegments.push({
          start: captionSegment.start,
          end: captionSegment.end,
          score: 0.5, // Base audio score (moderate)
          type: 'speech',
          captionText: captionResult.caption.text,
          aiAnalysis: captionResult,
          combinedScore: captionResult.score * 0.8 // Slightly reduce confidence without audio validation
        });
      }
    }
    
    // Sort by combined score in descending order
    return enhancedSegments.sort((a, b) => b.combinedScore - a.combinedScore);
  }

  /**
   * Finds caption analysis results that overlap with an audio segment
   * @param audioSegment Audio-based segment
   * @param captionSegments Caption segments with analysis
   * @returns Array of overlapping caption segments
   */
  private findOverlappingCaptions(
    audioSegment: Segment,
    captionSegments: Array<{start: number, end: number, analysis: AnalysisResult & {caption: Caption}}>
  ): Array<{start: number, end: number, analysis: AnalysisResult & {caption: Caption}}> {
    return captionSegments.filter(captionSegment => 
      this.segmentsOverlap(
        { start: audioSegment.start, end: audioSegment.end },
        { start: captionSegment.start, end: captionSegment.end }
      )
    );
  }

  /**
   * Determines if two time segments overlap
   * @param segment1 First segment with start and end times
   * @param segment2 Second segment with start and end times
   * @returns Boolean indicating if segments overlap
   */
  private segmentsOverlap(
    segment1: {start: number, end: number},
    segment2: {start: number, end: number}
  ): boolean {
    // Segments overlap if one starts before the other ends
    return segment1.start < segment2.end && segment2.start < segment1.end;
  }

  /**
   * Gets the top N viral segments based on combined score
   * @param segments Enhanced segments with combined scores
   * @param count Number of segments to return
   * @returns Top N segments
   */
  public getTopSegments(segments: EnhancedSegment[], count: number = 3): EnhancedSegment[] {
    return segments.slice(0, count);
  }

  /**
   * Filters segments by minimum duration
   * @param segments Enhanced segments to filter
   * @param minDuration Minimum duration in seconds
   * @param maxDuration Maximum duration in seconds
   * @returns Filtered segments
   */
  public filterSegmentsByDuration(
    segments: EnhancedSegment[],
    minDuration: number = 5,
    maxDuration: number = 60
  ): EnhancedSegment[] {
    return segments.filter(segment => {
      const duration = segment.end - segment.start;
      return duration >= minDuration && duration <= maxDuration;
    });
  }
}

export default EnhancedViralDetector;
