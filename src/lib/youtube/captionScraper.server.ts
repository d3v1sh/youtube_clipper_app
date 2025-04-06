// This is a server-side only module
// Create a separate file for client-side components

import axios from 'axios';
import { JSDOM } from 'jsdom';

/**
 * Interface for caption data
 */
export interface Caption {
  start: number;
  duration: number;
  text: string;
}

/**
 * Class for scraping and processing YouTube captions
 */
export class CaptionScraper {
  /**
   * Fetches captions from a YouTube video without using the YouTube API
   * @param videoId YouTube video ID
   * @returns Promise with array of caption segments
   */
  public async fetchCaptions(videoId: string): Promise<Caption[]> {
    try {
      // First, get the video page to extract caption track URLs
      const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const response = await axios.get(videoUrl);
      
      // Extract caption track information from the page
      const captionTracks = this.extractCaptionTracks(response.data);
      
      if (captionTracks.length === 0) {
        console.log('No caption tracks found for this video');
        return [];
      }
      
      // Prioritize English captions if available
      const captionTrack = captionTracks.find(track => 
        track.languageCode === 'en' || track.name.toLowerCase().includes('english')
      ) || captionTracks[0];
      
      // Fetch the caption track
      const captionResponse = await axios.get(captionTrack.baseUrl);
      
      // Parse the XML caption data
      return this.parseXmlCaptions(captionResponse.data);
    } catch (error) {
      console.error('Error fetching captions:', error);
      return [];
    }
  }

  /**
   * Extracts caption track information from the YouTube page HTML
   * @param html YouTube page HTML
   * @returns Array of caption track objects
   */
  private extractCaptionTracks(html: string): Array<{
    baseUrl: string;
    name: string;
    languageCode: string;
  }> {
    try {
      // Extract the ytInitialPlayerResponse JSON from the page
      const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
      
      if (!playerResponseMatch || !playerResponseMatch[1]) {
        return [];
      }
      
      // Parse the JSON
      const playerResponse = JSON.parse(playerResponseMatch[1]);
      
      // Extract caption tracks
      const captionTracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks || [];
      
      return captionTracks.map((track: any) => ({
        baseUrl: track.baseUrl,
        name: track.name?.simpleText || '',
        languageCode: track.languageCode || ''
      }));
    } catch (error) {
      console.error('Error extracting caption tracks:', error);
      return [];
    }
  }

  /**
   * Parses XML caption data into structured caption objects
   * @param xmlData XML caption data
   * @returns Array of caption objects
   */
  private parseXmlCaptions(xmlData: string): Caption[] {
    try {
      const dom = new JSDOM(xmlData, { contentType: "text/xml" });
      const document = dom.window.document;
      const captions: Caption[] = [];
      
      const textElements = document.querySelectorAll('text');
      textElements.forEach((element) => {
        const start = parseFloat(element.getAttribute('start') || '0');
        const duration = parseFloat(element.getAttribute('dur') || '0');
        const text = element.textContent?.trim() || '';
        
        if (text) {
          captions.push({ start, duration, text });
        }
      });
      
      return captions;
    } catch (error) {
      console.error('Error parsing XML captions:', error);
      return [];
    }
  }

  /**
   * Groups captions into larger segments for analysis
   * @param captions Array of individual caption objects
   * @param segmentDuration Target duration for each segment in seconds
   * @returns Array of grouped caption segments
   */
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

  /**
   * Finds segments that match specific keywords or phrases
   * @param captions Array of caption objects
   * @param keywords Array of keywords or phrases to search for
   * @returns Array of matching caption segments
   */
  public findSegmentsWithKeywords(captions: Caption[], keywords: string[]): Caption[] {
    if (captions.length === 0 || keywords.length === 0) return [];
    
    return captions.filter(caption => {
      const lowerText = caption.text.toLowerCase();
      return keywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
    });
  }

  /**
   * Converts caption timestamps to video segment boundaries
   * @param captions Array of caption objects
   * @returns Array of segment objects with start and end times
   */
  public captionsToSegments(captions: Caption[]): Array<{start: number, end: number, text: string}> {
    return captions.map(caption => ({
      start: caption.start,
      end: caption.start + caption.duration,
      text: caption.text
    }));
  }
}

export default CaptionScraper;
