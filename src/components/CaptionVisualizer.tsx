"use client";

import { useState, useEffect } from 'react';
import { Player } from "@remotion/player";
import { VideoComposition } from "./VideoComposition";

interface CaptionVisualizerProps {
  captions: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  onSelectSegment?: (start: number, end: number) => void;
  currentTime?: number;
  duration: number;
}

export default function CaptionVisualizer({
  captions,
  onSelectSegment,
  currentTime = 0,
  duration,
}: CaptionVisualizerProps) {
  const [hoveredSegment, setHoveredSegment] = useState<number | null>(null);
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  
  // Calculate positions for visualization
  const getSegmentStyle = (start: number, end: number, index: number) => {
    const startPercent = (start / duration) * 100;
    const widthPercent = ((end - start) / duration) * 100;
    
    // Calculate color based on caption length and position
    const hue = 200 + (index * 20) % 160; // Range from 200 to 360 (blues to purples)
    const saturation = 70 + (index % 3) * 10; // Vary saturation
    const lightness = 50 + (index % 5) * 5; // Vary lightness
    
    const isHovered = hoveredSegment === index;
    const isSelected = selectedSegment === index;
    const isActive = currentTime >= start && currentTime <= end;
    
    return {
      left: `${startPercent}%`,
      width: `${widthPercent}%`,
      backgroundColor: isSelected 
        ? `hsl(${hue}, ${saturation}%, ${lightness}%)`
        : isHovered
          ? `hsl(${hue}, ${saturation - 10}%, ${lightness + 15}%)`
          : isActive
            ? `hsl(${hue}, ${saturation}%, ${lightness}%)`
            : `hsl(${hue}, ${saturation - 20}%, ${lightness + 25}%)`,
      height: isSelected || isHovered || isActive ? '24px' : '16px',
      transform: isSelected || isHovered || isActive ? 'translateY(-4px)' : 'none',
      zIndex: isSelected ? 3 : isHovered ? 2 : isActive ? 1 : 0,
      opacity: isSelected ? 1 : isHovered ? 0.9 : isActive ? 0.8 : 0.6,
      boxShadow: isSelected || isHovered 
        ? '0 4px 12px rgba(0, 0, 0, 0.2)' 
        : isActive 
          ? '0 2px 8px rgba(0, 0, 0, 0.15)'
          : 'none',
    };
  };
  
  const handleSegmentClick = (index: number) => {
    setSelectedSegment(index);
    if (onSelectSegment && captions[index]) {
      onSelectSegment(captions[index].start, captions[index].end);
    }
  };
  
  return (
    <div className="caption-visualizer w-full">
      <div className="caption-timeline relative h-8 bg-gray-100 rounded-lg overflow-hidden mb-4">
        {/* Current time indicator */}
        <div 
          className="absolute top-0 h-full w-0.5 bg-red-500 z-10"
          style={{ left: `${(currentTime / duration) * 100}%` }}
        />
        
        {/* Caption segments */}
        {captions.map((caption, index) => (
          <div
            key={index}
            className="absolute top-1 rounded-md transition-all duration-200 cursor-pointer"
            style={getSegmentStyle(caption.start, caption.end, index)}
            onMouseEnter={() => setHoveredSegment(index)}
            onMouseLeave={() => setHoveredSegment(null)}
            onClick={() => handleSegmentClick(index)}
            title={`${Math.floor(caption.start / 60)}:${Math.floor(caption.start % 60).toString().padStart(2, '0')} - ${caption.text.substring(0, 30)}${caption.text.length > 30 ? '...' : ''}`}
          />
        ))}
        
        {/* Time markers */}
        <div className="absolute bottom-0 w-full flex justify-between text-xs text-gray-500 px-1">
          <span>0:00</span>
          <span>{Math.floor(duration / 60)}:{Math.floor(duration % 60).toString().padStart(2, '0')}</span>
        </div>
      </div>
      
      {/* Caption text display */}
      <div className="caption-text-display">
        {selectedSegment !== null && captions[selectedSegment] && (
          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <div className="flex justify-between text-sm text-gray-500 mb-1">
              <span>
                {Math.floor(captions[selectedSegment].start / 60)}:
                {Math.floor(captions[selectedSegment].start % 60).toString().padStart(2, '0')} - 
                {Math.floor(captions[selectedSegment].end / 60)}:
                {Math.floor(captions[selectedSegment].end % 60).toString().padStart(2, '0')}
              </span>
              <span>
                Duration: {Math.round((captions[selectedSegment].end - captions[selectedSegment].start) * 10) / 10}s
              </span>
            </div>
            <p className="text-gray-800 font-medium">
              {captions[selectedSegment].text}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
