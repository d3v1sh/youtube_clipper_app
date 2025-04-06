"use client";

import { useState, useEffect, useRef } from 'react';
import VideoPreview from './VideoPreview';
import CaptionVisualizer from './CaptionVisualizer';
import axios from 'axios';

interface RemotionClipperProps {
  videoUrl: string;
  captions: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  videoDuration: number;
  onClipGenerated?: (clipUrl: string) => void;
}

export default function RemotionClipper({
  videoUrl,
  captions,
  videoDuration,
  onClipGenerated
}: RemotionClipperProps) {
  const [selectedSegment, setSelectedSegment] = useState<{start: number, end: number} | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSegmentSelect = (start: number, end: number) => {
    setSelectedSegment({ start, end });
  };
  
  const handleRenderClip = async () => {
    if (!selectedSegment) return;
    
    try {
      setIsRendering(true);
      setRenderProgress(0);
      setError(null);
      
      // Find captions that fall within the selected segment
      const segmentCaptions = captions.filter(caption => 
        (caption.start >= selectedSegment.start && caption.start <= selectedSegment.end) ||
        (caption.end >= selectedSegment.start && caption.end <= selectedSegment.end) ||
        (caption.start <= selectedSegment.start && caption.end >= selectedSegment.end)
      );
      
      // Create a unique clip ID
      const clipId = Date.now().toString();
      
      // Start the rendering process
      const response = await axios.post('/api/render-clip', {
        clipId,
        videoUrl,
        startTime: selectedSegment.start,
        endTime: selectedSegment.end,
        captions: segmentCaptions
      }, {
        responseType: 'blob',
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setRenderProgress(progress);
          }
        }
      });
      
      // Create a blob URL for the rendered clip
      const blob = new Blob([response.data], { type: 'video/mp4' });
      const url = URL.createObjectURL(blob);
      
      setClipUrl(url);
      setIsRendering(false);
      
      if (onClipGenerated) {
        onClipGenerated(url);
      }
    } catch (err) {
      setIsRendering(false);
      setError('Error rendering clip. Please try again.');
      console.error('Error rendering clip:', err);
    }
  };
  
  const handleDownloadClip = () => {
    if (!clipUrl) return;
    
    const a = document.createElement('a');
    a.href = clipUrl;
    a.download = `viral_clip_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <div className="remotion-clipper bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4 text-purple-800">Advanced Clip Editor</h2>
      
      {/* Caption Visualizer */}
      <div className="mb-6">
        <h3 className="text-md font-semibold mb-2 text-gray-700">Caption Timeline</h3>
        <CaptionVisualizer 
          captions={captions}
          onSelectSegment={handleSegmentSelect}
          currentTime={selectedSegment?.start || 0}
          duration={videoDuration}
        />
      </div>
      
      {/* Preview */}
      {selectedSegment && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2 text-gray-700">Preview</h3>
          <div className="flex justify-center">
            <VideoPreview 
              videoUrl={videoUrl}
              captions={captions.filter(caption => 
                (caption.start >= selectedSegment.start && caption.start <= selectedSegment.end) ||
                (caption.end >= selectedSegment.start && caption.end <= selectedSegment.end) ||
                (caption.start <= selectedSegment.start && caption.end >= selectedSegment.end)
              )}
              startTime={selectedSegment.start}
              endTime={selectedSegment.end}
            />
          </div>
          
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600 mb-2">
              Selected segment: {Math.floor(selectedSegment.start / 60)}:{Math.floor(selectedSegment.start % 60).toString().padStart(2, '0')} - 
              {Math.floor(selectedSegment.end / 60)}:{Math.floor(selectedSegment.end % 60).toString().padStart(2, '0')} 
              (Duration: {Math.round((selectedSegment.end - selectedSegment.start) * 10) / 10}s)
            </p>
            
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400 transition-colors"
              onClick={handleRenderClip}
              disabled={isRendering}
            >
              {isRendering ? `Rendering (${renderProgress}%)` : 'Render Clip'}
            </button>
          </div>
        </div>
      )}
      
      {/* Rendered Clip */}
      {clipUrl && (
        <div className="mb-6">
          <h3 className="text-md font-semibold mb-2 text-gray-700">Rendered Clip</h3>
          <div className="flex justify-center mb-4">
            <video 
              src={clipUrl} 
              controls 
              className="rounded-lg shadow-sm max-w-full" 
              style={{ maxHeight: '400px' }}
            />
          </div>
          
          <div className="text-center">
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              onClick={handleDownloadClip}
            >
              Download Clip
            </button>
          </div>
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
