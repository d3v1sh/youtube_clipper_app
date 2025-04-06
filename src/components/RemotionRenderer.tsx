"use client";

import { useCallback, useState } from "react";
import { getVideoMetadata, renderMedia, selectComposition } from "@remotion/renderer";
import { VideoComposition } from "./VideoComposition";

interface RemotionRendererProps {
  videoUrl: string;
  captions: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  startTime: number;
  endTime: number;
  onProgress?: (progress: number) => void;
  onComplete?: (outputPath: string) => void;
  onError?: (error: Error) => void;
}

export default function RemotionRenderer({
  videoUrl,
  captions,
  startTime,
  endTime,
  onProgress,
  onComplete,
  onError,
}: RemotionRendererProps) {
  const [isRendering, setIsRendering] = useState(false);
  const [progress, setProgress] = useState(0);

  const renderVideo = useCallback(async () => {
    try {
      setIsRendering(true);
      setProgress(0);

      // Calculate duration in frames
      const durationInFrames = Math.round((endTime - startTime) * 30); // 30fps
      
      // Create a unique output filename
      const timestamp = new Date().getTime();
      const outputPath = `/tmp/clip_${timestamp}.mp4`;

      // Configure the composition
      const composition = await selectComposition({
        component: VideoComposition,
        inputProps: {
          videoUrl,
          captions,
          startTime,
          endTime,
        },
        durationInFrames,
        fps: 30,
        width: 1280,
        height: 720,
      });

      // Render the video
      await renderMedia({
        composition,
        outputLocation: outputPath,
        codec: 'h264',
        onProgress: ({ progress: renderProgress }) => {
          const progressPercent = Math.round(renderProgress * 100);
          setProgress(progressPercent);
          onProgress?.(progressPercent);
        },
      });

      setIsRendering(false);
      onComplete?.(outputPath);
      return outputPath;
    } catch (error) {
      setIsRendering(false);
      console.error('Error rendering video:', error);
      onError?.(error as Error);
      return null;
    }
  }, [videoUrl, captions, startTime, endTime, onProgress, onComplete, onError]);

  return {
    renderVideo,
    isRendering,
    progress,
  };
}
