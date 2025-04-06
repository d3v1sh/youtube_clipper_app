"use client";

import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Caption } from '@/lib/youtube/captionScraper';

// OpenRouter API key
const OPENROUTER_API_KEY = "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";

// Types for video info and segments
interface VideoInfo {
  videoId: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelTitle: string;
  duration: number;
  viewCount: number;
}

interface Segment {
  start: number;
  end: number;
  score: number;
  type: string;
}

interface EnhancedSegment extends Segment {
  captionText?: string;
  aiAnalysis?: {
    score: number;
    reasons: string[];
    emotions: string[];
    keywords: string[];
    summary: string;
  };
  combinedScore: number;
}

interface ClipResult {
  inputPath: string;
  outputPath: string;
  segment: EnhancedSegment;
  duration: number;
  success: boolean;
}

export default function Home() {
  // State for YouTube URL input
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [videoId, setVideoId] = useState('');
  
  // State for video processing
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState<string | null>(null);
  
  // State for captions and analysis
  const [captions, setCaptions] = useState<Caption[]>([]);
  
  // State for viral segments
  const [viralSegments, setViralSegments] = useState<EnhancedSegment[]>([]);
  const [selectedSegments, setSelectedSegments] = useState<EnhancedSegment[]>([]);
  
  // State for generated clips
  const [clipResults, setClipResults] = useState<ClipResult[]>([]);
  const [videoPath, setVideoPath] = useState<string | null>(null);
  
  // Validate YouTube URL and extract video ID
  const validateUrl = (url: string) => {
    // Simple validation - could be improved
    const isValid = url.includes('youtube.com/watch') || url.includes('youtu.be/');
    setIsValidUrl(isValid);
    
    if (isValid) {
      // Extract video ID
      let id = '';
      if (url.includes('youtube.com/watch')) {
        const urlObj = new URL(url);
        id = urlObj.searchParams.get('v') || '';
      } else if (url.includes('youtu.be/')) {
        id = url.split('youtu.be/')[1].split('?')[0];
      }
      setVideoId(id);
    } else {
      setVideoId('');
    }
    
    return isValid;
  };
  
  // Handle URL input change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setYoutubeUrl(url);
    validateUrl(url);
  };
  
  // Fetch video info
  const fetchVideoInfo = async () => {
    if (!isValidUrl || !videoId) return;
    
    setIsLoading(true);
    setError(null);
    setProcessingStep('Fetching video information');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock video info
      const info: VideoInfo = {
        videoId,
        title: "Sample Podcast Episode #123 - Guest Interview",
        description: "In this episode, we discuss various topics with our special guest including technology, science, and current events.",
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        channelTitle: "Sample Podcast Channel",
        duration: 3600, // 1 hour
        viewCount: 250000
      };
      
      setVideoInfo(info);
      
      // Simulate fetching captions
      await fetchCaptions(videoId);
    } catch (err: any) {
      setError(`Error fetching video info: ${err.message}`);
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
    }
  };
  
  // Fetch captions
  const fetchCaptions = async (videoId: string) => {
    setProcessingStep('Fetching video captions');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock captions
      const mockCaptions: Caption[] = [
        {
          start: 120,
          duration: 15,
          text: "I think the most fascinating thing about artificial intelligence is how it's changing the way we approach problem-solving in almost every industry."
        },
        {
          start: 240,
          duration: 20,
          text: "When we look at climate change, we need to consider both technological solutions and policy changes. It's not an either-or situation."
        },
        {
          start: 360,
          duration: 18,
          text: "The story about how they discovered this new species is absolutely incredible. It completely changes our understanding of evolution in that region."
        },
        {
          start: 480,
          duration: 25,
          text: "I couldn't believe it when I saw the data. The results were shocking and contradicted everything we thought we knew about consumer behavior."
        },
        {
          start: 600,
          duration: 22,
          text: "That moment when everyone realized what was happening - you could hear a pin drop. It was the most dramatic turning point in the entire conference."
        }
      ];
      
      setCaptions(mockCaptions);
      return mockCaptions;
    } catch (err: any) {
      setError(`Error fetching captions: ${err.message}`);
      return [];
    }
  };
  
  // Process video for viral content
  const processVideo = async () => {
    if (!videoInfo || !videoId) return;
    
    setIsLoading(true);
    setError(null);
    setDownloadProgress(0);
    setProcessingStep('Downloading video');
    
    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          const newProgress = prev + 10;
          if (newProgress >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return newProgress;
        });
      }, 500);
      
      // Simulate video download
      await new Promise(resolve => setTimeout(resolve, 2000));
      const simulatedVideoPath = `/downloads/${videoId}.mp4`;
      setVideoPath(simulatedVideoPath);
      
      clearInterval(progressInterval);
      setDownloadProgress(100);
      
      // Simulate caption analysis with OpenRouter AI
      setProcessingStep('Analyzing captions with AI');
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock AI analysis results
      const mockAnalysisResults = [
        {
          caption: captions[0],
          score: 0.85,
          reasons: ["Discusses cutting-edge technology", "Mentions industry impact", "Educational content"],
          emotions: ["Curiosity", "Excitement"],
          keywords: ["artificial intelligence", "problem-solving", "industry"],
          summary: "Insightful commentary on AI's transformative impact across industries"
        },
        {
          caption: captions[1],
          score: 0.72,
          reasons: ["Addresses controversial topic", "Balanced perspective", "Timely issue"],
          emotions: ["Concern", "Thoughtfulness"],
          keywords: ["climate change", "technological solutions", "policy changes"],
          summary: "Balanced take on climate change solutions combining technology and policy"
        },
        {
          caption: captions[2],
          score: 0.91,
          reasons: ["Surprising discovery", "Scientific breakthrough", "Storytelling element"],
          emotions: ["Amazement", "Excitement"],
          keywords: ["new species", "discovery", "evolution"],
          summary: "Exciting narrative about a scientific discovery with evolutionary implications"
        },
        {
          caption: captions[3],
          score: 0.88,
          reasons: ["Unexpected results", "Data revelation", "Challenges assumptions"],
          emotions: ["Shock", "Surprise"],
          keywords: ["data", "shocking results", "consumer behavior"],
          summary: "Shocking data that contradicts established understanding of consumer behavior"
        },
        {
          caption: captions[4],
          score: 0.94,
          reasons: ["Dramatic moment", "Emotional tension", "Vivid description"],
          emotions: ["Tension", "Drama"],
          keywords: ["dramatic moment", "turning point", "conference"],
          summary: "Highly dramatic description of a pivotal moment at a conference"
        }
      ];
      
      // Detect viral segments from audio
      setProcessingStep('Detecting viral segments from audio');
      
      // Simulate audio analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate some sample segments based on video duration
      const duration = videoInfo.duration;
      const audioSegments: Segment[] = [
        {
          start: 115,
          end: 140,
          score: 0.75,
          type: 'speech'
        },
        {
          start: 235,
          end: 265,
          score: 0.68,
          type: 'speech'
        },
        {
          start: 355,
          end: 385,
          score: 0.82,
          type: 'speech'
        },
        {
          start: 475,
          end: 510,
          score: 0.79,
          type: 'speech'
        },
        {
          start: 595,
          end: 625,
          score: 0.88,
          type: 'speech'
        }
      ];
      
      // Combine audio and caption analysis
      setProcessingStep('Combining audio and caption analysis');
      
      // Create enhanced segments
      const enhancedSegments: EnhancedSegment[] = audioSegments.map((segment, index) => {
        const matchingAnalysis = mockAnalysisResults[index];
        
        return {
          ...segment,
          captionText: matchingAnalysis.caption.text,
          aiAnalysis: {
            score: matchingAnalysis.score,
            reasons: matchingAnalysis.reasons,
            emotions: matchingAnalysis.emotions,
            keywords: matchingAnalysis.keywords,
            summary: matchingAnalysis.summary
          },
          combinedScore: (segment.score * 0.4) + (matchingAnalysis.score * 0.6)
        };
      });
      
      // Sort by combined score
      const sortedSegments = [...enhancedSegments].sort((a, b) => b.combinedScore - a.combinedScore);
      
      setViralSegments(sortedSegments);
    } catch (err: any) {
      setError(`Error processing video: ${err.message}`);
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
    }
  };
  
  // Toggle segment selection
  const toggleSegmentSelection = (segment: EnhancedSegment) => {
    setSelectedSegments(prev => {
      const isSelected = prev.some(s => 
        s.start === segment.start && s.end === segment.end
      );
      
      if (isSelected) {
        return prev.filter(s => 
          s.start !== segment.start || s.end !== segment.end
        );
      } else {
        return [...prev, segment];
      }
    });
  };
  
  // Generate clips from selected segments
  const generateClips = async () => {
    if (!videoPath || selectedSegments.length === 0) return;
    
    setIsLoading(true);
    setError(null);
    setProcessingStep('Generating clips');
    
    try {
      // Simulate clip generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const results: ClipResult[] = selectedSegments.map((segment, index) => {
        const duration = segment.end - segment.start;
        const outputPath = `/clips/${videoId}_clip_${index + 1}.mp4`;
        
        return {
          inputPath: videoPath,
          outputPath,
          segment,
          duration,
          success: true
        };
      });
      
      setClipResults(results);
    } catch (err: any) {
      setError(`Error generating clips: ${err.message}`);
    } finally {
      setIsLoading(false);
      setProcessingStep(null);
    }
  };
  
  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <main className="flex min-h-screen flex-col items-center p-4 bg-gray-50">
      <div className="w-full max-w-6xl">
        <h1 className="text-4xl font-bold mb-6 text-center text-purple-800">
          YouTube Podcast Clipper
        </h1>
        <p className="text-center mb-8 text-gray-600">
          Extract viral segments from YouTube podcasts using AI-powered caption and audio analysis
        </p>
        
        {/* YouTube URL Input */}
        <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
          <label htmlFor="youtube-url" className="block text-sm font-medium mb-2 text-gray-700">
            YouTube Podcast URL
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              id="youtube-url"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="https://www.youtube.com/watch?v=..."
              value={youtubeUrl}
              onChange={handleUrlChange}
            />
            <button
              className="px-6 py-3 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              disabled={!isValidUrl || isLoading}
              onClick={fetchVideoInfo}
            >
              Fetch Info
            </button>
          </div>
          {!isValidUrl && youtubeUrl && (
            <p className="mt-1 text-red-500 text-xs">Please enter a valid YouTube URL</p>
          )}
        </div>
        
        {/* Loading Indicator */}
        {isLoading && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-purple-800">
              {processingStep || 'Processing...'}
            </h2>
            
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-purple-600 h-3 rounded-full transition-all duration-300" 
                style={{ width: `${downloadProgress}%` }}
              ></div>
            </div>
            <p className="text-center mt-2 text-gray-600">{downloadProgress}% Complete</p>
          </div>
        )}
        
        {/* Error Display */}
        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {/* Video Info */}
        {videoInfo && !isLoading && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/3">
                <img 
                  src={videoInfo.thumbnailUrl} 
                  alt={videoInfo.title}
                  className="w-full rounded-md shadow-sm"
                />
              </div>
              <div className="md:w-2/3">
                <h2 className="text-2xl font-bold mb-2 text-gray-800">{videoInfo.title}</h2>
                <p className="text-sm mb-2 text-gray-600">
                  <span className="font-semibold">Channel:</span> {videoInfo.channelTitle}
                </p>
                <p className="text-sm mb-2 text-gray-600">
                  <span className="font-semibold">Duration:</span> {formatTime(videoInfo.duration)}
                </p>
                <p className="text-sm mb-4 text-gray-600">
                  <span className="font-semibold">Views:</span> {videoInfo.viewCount.toLocaleString()}
                </p>
                <p className="text-sm mb-6 text-gray-700 line-clamp-3">
                  {videoInfo.description}
                </p>
                <button
                  className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                  disabled={isLoading}
                  onClick={processVideo}
                >
                  Analyze with AI
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Viral Segments */}
        {viralSegments.length > 0 && !isLoading && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">
              AI-Detected Viral Segments
            </h2>
            <p className="mb-4 text-gray-600">
              Our AI has analyzed both audio patterns and caption content to identify the most viral segments.
              Select the segments you want to include in your reel.
            </p>
            
            <div className="space-y-4">
              {viralSegments.map((segment, index) => (
                <div 
                  key={index}
                  className={`p-4 border rounded-md cursor-pointer transition-all ${
                    selectedSegments.some(s => s.start === segment.start && s.end === segment.end)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-purple-300 hover:bg-purple-50/50'
                  }`}
                  onClick={() => toggleSegmentSelection(segment)}
                >
                  <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-lg text-gray-800">Segment {index + 1}</span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {formatTime(segment.start)} - {formatTime(segment.end)}
                        </span>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                          {(segment.end - segment.start).toFixed(1)}s
                        </span>
                      </div>
                      
                      {segment.captionText && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-600 line-clamp-2">
                            "{segment.captionText}"
                          </p>
                        </div>
                      )}
                      
                      {segment.aiAnalysis && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500">
                            <span className="font-semibold">AI Analysis:</span> {segment.aiAnalysis.summary}
                          </p>
                          {segment.aiAnalysis.keywords.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {segment.aiAnalysis.keywords.slice(0, 3).map((keyword, i) => (
                                <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                                  {keyword}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="text-right flex flex-col items-end">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-600">Virality Score</span>
                        <div className="w-12 h-12 rounded-full flex items-center justify-center border-4" 
                          style={{
                            borderColor: `hsl(${Math.min(segment.combinedScore * 120, 120)}, 70%, 50%)`,
                            backgroundColor: `hsl(${Math.min(segment.combinedScore * 120, 120)}, 70%, 95%)`
                          }}>
                          <span className="text-lg font-bold" 
                            style={{color: `hsl(${Math.min(segment.combinedScore * 120, 120)}, 70%, 40%)`}}>
                            {(segment.combinedScore * 100).toFixed(0)}
                          </span>
                        </div>
                      </div>
                      
                      {segment.aiAnalysis && segment.aiAnalysis.emotions.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 justify-end">
                          {segment.aiAnalysis.emotions.slice(0, 2).map((emotion, i) => (
                            <span key={i} className="px-2 py-0.5 bg-pink-100 text-pink-600 text-xs rounded-full">
                              {emotion}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                className="px-8 py-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors text-lg font-medium"
                disabled={selectedSegments.length === 0 || isLoading}
                onClick={generateClips}
              >
                Generate {selectedSegments.length} {selectedSegments.length === 1 ? 'Clip' : 'Clips'}
              </button>
            </div>
            
            {/* Remotion Advanced Editor */}
            {viralSegments.length > 0 && !isLoading && (
              <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 text-purple-800 text-center">
                  Advanced Editing with Remotion
                </h3>
                <p className="text-center mb-6 text-gray-600">
                  Use our advanced editor powered by Remotion to create professional clips with captions
                </p>
                
                <div className="remotion-editor-container">
                  {/* RemotionClipper component will be rendered here */}
                  {/* This is a placeholder that will be replaced with actual implementation */}
                  <div className="bg-gray-100 p-6 rounded-lg text-center">
                    <p className="text-gray-700">
                      Advanced editor is loading...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Generated Clips */}
        {clipResults.length > 0 && !isLoading && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-purple-800">Generated Clips</h2>
            <p className="mb-4 text-gray-600">
              Your viral clips are ready! Download them individually or combine them into a single reel.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {clipResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-md bg-gray-50">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium text-gray-800">Clip {index + 1}</h3>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {result.duration.toFixed(1)}s
                    </span>
                  </div>
                  
                  <p className="text-sm mb-2 text-gray-600">
                    <span className="font-semibold">Timestamp:</span> {formatTime(result.segment.start)} - {formatTime(result.segment.end)}
                  </p>
                  
                  {result.segment.captionText && (
                    <p className="text-sm mb-3 text-gray-600 line-clamp-2">
                      "{result.segment.captionText}"
                    </p>
                  )}
                  
                  <div className="mt-3 flex gap-2">
                    <a 
                      href={`/api/download?clipId=${index + 1}`}
                      download={`viral_clip_${index + 1}.mp4`}
                      className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors flex-1 text-center"
                    >
                      Download Clip
                    </a>
                    <a
                      href={`/api/preview?clipId=${index + 1}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300 transition-colors text-center"
                    >
                      Preview
                    </a>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6 text-center">
              <button
                className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Combine All Clips into Reel
              </button>
            </div>
          </div>
        )}
      </div>
      
      <footer className="w-full mt-12 py-6 text-center text-gray-500 text-sm">
        <p>YouTube Podcast Clipper - Powered by AI</p>
        <p className="mt-1">Uses OpenRouter AI with Llama 4 Maverick for viral content detection</p>
      </footer>
    </main>
  );
}
