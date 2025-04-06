"use client";

import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { VideoComposition } from "./VideoComposition";

interface VideoPreviewProps {
  videoUrl: string;
  captions: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  startTime: number;
  endTime: number;
}

export default function VideoPreview({
  videoUrl,
  captions,
  startTime,
  endTime,
}: VideoPreviewProps) {
  const [dimensions, setDimensions] = useState({ width: 640, height: 360 });
  const durationInFrames = Math.round((endTime - startTime) * 30); // 30fps

  useEffect(() => {
    // Responsive sizing
    const handleResize = () => {
      const width = Math.min(window.innerWidth - 40, 640);
      const height = Math.round((width / 16) * 9);
      setDimensions({ width, height });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="video-preview-container">
      <Player
        component={VideoComposition}
        inputProps={{
          videoUrl,
          captions,
          startTime,
          endTime,
        }}
        durationInFrames={durationInFrames}
        fps={30}
        compositionWidth={dimensions.width}
        compositionHeight={dimensions.height}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          borderRadius: "8px",
          overflow: "hidden",
        }}
        controls
        autoPlay
        loop
      />
    </div>
  );
}
