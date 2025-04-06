import axios from 'axios';
import { Caption } from './captionScraper';

/**
 * Interface for OpenRouter AI analysis results
 */
export interface AnalysisResult {
  score: number;
  reasons: string[];
  emotions: string[];
  keywords: string[];
  summary: string;
}

/**
 * Class for analyzing captions using OpenRouter AI
 */
export class CaptionAnalyzer {
  private apiKey: string;
  private baseUrl: string = 'https://openrouter.ai/api/v1';
  private model: string = 'meta-llama/llama-4-maverick:free';

  /**
   * Constructor for CaptionAnalyzer
   * @param apiKey OpenRouter API key
   * @param model Optional model override
   */
  constructor(apiKey: string, model?: string) {
    this.apiKey = apiKey;
    if (model) {
      this.model = model;
    }
  }

  /**
   * Analyzes caption text to determine viral potential
   * @param captionText Text to analyze
   * @returns Promise with analysis result
   */
  public async analyzeViralPotential(captionText: string): Promise<AnalysisResult> {
    try {
      const prompt = this.createAnalysisPrompt(captionText);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an expert in viral content analysis. Your task is to analyze text from video captions and determine its viral potential. Provide detailed analysis in JSON format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          response_format: { type: 'json_object' }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.choices[0].message.content;
      return this.parseAnalysisResult(result);
    } catch (error) {
      console.error('Error analyzing caption with OpenRouter AI:', error);
      return {
        score: 0,
        reasons: ['Error analyzing content'],
        emotions: [],
        keywords: [],
        summary: 'Analysis failed'
      };
    }
  }

  /**
   * Analyzes multiple caption segments
   * @param captions Array of caption segments
   * @returns Promise with array of analysis results
   */
  public async analyzeMultipleSegments(captions: Caption[]): Promise<Array<AnalysisResult & {caption: Caption}>> {
    const results: Array<AnalysisResult & {caption: Caption}> = [];
    
    // Process captions in batches to avoid rate limiting
    const batchSize = 3;
    for (let i = 0; i < captions.length; i += batchSize) {
      const batch = captions.slice(i, i + batchSize);
      const batchPromises = batch.map(async (caption) => {
        const analysis = await this.analyzeViralPotential(caption.text);
        return {
          ...analysis,
          caption
        };
      });
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < captions.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Sort results by score in descending order
    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Creates a prompt for the AI to analyze caption text
   * @param captionText Text to analyze
   * @returns Formatted prompt
   */
  private createAnalysisPrompt(captionText: string): string {
    return `
Analyze the following text from a video caption and determine its viral potential.
Respond with a JSON object containing:
- score: A number from 0 to 1 representing viral potential
- reasons: Array of reasons why this content might go viral
- emotions: Array of emotions this content might evoke
- keywords: Array of key phrases or topics in the content
- summary: A brief summary of the content

Caption text:
"""
${captionText}
"""

Focus on identifying elements that make content shareable, such as:
- Emotional impact (surprising, funny, inspiring, controversial)
- Storytelling elements
- Relatable experiences
- Unique insights or information
- Controversial or debate-worthy statements
- Quotable moments

Respond only with the JSON object.
`;
  }

  /**
   * Parses the AI response into a structured analysis result
   * @param responseText AI response text
   * @returns Structured analysis result
   */
  private parseAnalysisResult(responseText: string): AnalysisResult {
    try {
      // If the response is already a JSON object, parse it
      if (typeof responseText === 'object') {
        const result = responseText as any;
        return {
          score: parseFloat(result.score) || 0,
          reasons: Array.isArray(result.reasons) ? result.reasons : [],
          emotions: Array.isArray(result.emotions) ? result.emotions : [],
          keywords: Array.isArray(result.keywords) ? result.keywords : [],
          summary: result.summary || ''
        };
      }
      
      // Otherwise, try to parse the response as JSON
      const result = JSON.parse(responseText);
      return {
        score: parseFloat(result.score) || 0,
        reasons: Array.isArray(result.reasons) ? result.reasons : [],
        emotions: Array.isArray(result.emotions) ? result.emotions : [],
        keywords: Array.isArray(result.keywords) ? result.keywords : [],
        summary: result.summary || ''
      };
    } catch (error) {
      console.error('Error parsing AI analysis result:', error);
      return {
        score: 0,
        reasons: ['Error parsing analysis result'],
        emotions: [],
        keywords: [],
        summary: 'Failed to parse analysis'
      };
    }
  }
}

export default CaptionAnalyzer;
