// Client-side caption types
export interface Caption {
  start: number;
  duration: number;
  text: string;
}

// Mock data and client-side functions for caption handling
export class CaptionScraper {
  // Client-side mock for grouping captions
  public groupCaptionsIntoSegments(captions: Caption[], segmentDuration: number = 15): Caption[] {
    if (captions.length === 0) return [];
    
    const segments: Caption[] = [];
    let currentSegment: Caption = {
      start: captions[0].start,
      duration: 0,
      text: ''
    };
    
    for (const caption of captions) {
      // If adding this caption would exceed the target duration, start a new segment
      if (currentSegment.duration > 0 && 
          currentSegment.duration + caption.duration > segmentDuration) {
        segments.push(currentSegment);
        currentSegment = {
          start: caption.start,
          duration: caption.duration,
          text: caption.text
        };
      } else {
        // Add this caption to the current segment
        currentSegment.duration += caption.duration;
        currentSegment.text += ' ' + caption.text;
      }
    }
    
    // Add the last segment if it has content
    if (currentSegment.duration > 0) {
      segments.push(currentSegment);
    }
    
    return segments;
  }

  // Client-side mock for finding segments with keywords
  public findSegmentsWithKeywords(captions: Caption[], keywords: string[]): Caption[] {
    if (captions.length === 0 || keywords.length === 0) return [];
    
    return captions.filter(caption => {
      const lowerText = caption.text.toLowerCase();
      return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    });
  }

  // Client-side mock for converting captions to segments
  public captionsToSegments(captions: Caption[]): Array<{start: number, end: number, text: string}> {
    return captions.map(caption => ({
      start: caption.start,
      end: caption.start + caption.duration,
      text: caption.text
    }));
  }
}

export default CaptionScraper;
