"use client";

import { AbsoluteFill, Sequence, useCurrentFrame, useVideoConfig, Video, Img } from "remotion";

interface VideoCompositionProps {
  videoUrl: string;
  captions: Array<{
    start: number;
    end: number;
    text: string;
  }>;
  startTime: number;
  endTime: number;
}

export const VideoComposition: React.FC<VideoCompositionProps> = ({
  videoUrl,
  captions,
  startTime,
  endTime,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  
  // Calculate current time in seconds
  const currentTimeInSeconds = startTime + frame / fps;
  
  // Find current caption
  const currentCaption = captions.find(
    caption => 
      currentTimeInSeconds >= caption.start && 
      currentTimeInSeconds <= caption.end
  );
  
  return (
    <AbsoluteFill style={{ backgroundColor: 'black' }}>
      {/* Video Layer */}
      <Sequence from={0}>
        <Video
          src={videoUrl}
          startFrom={startTime * fps}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </Sequence>
      
      {/* Caption Layer */}
      {currentCaption && (
        <Sequence from={0}>
          <AbsoluteFill
            style={{
              justifyContent: 'flex-end',
              alignItems: 'center',
              paddingBottom: 50,
            }}
          >
            <div
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                padding: '10px 20px',
                borderRadius: 8,
                maxWidth: '80%',
                textAlign: 'center',
              }}
            >
              <p
                style={{
                  color: 'white',
                  fontSize: Math.max(16, Math.round(width / 30)),
                  margin: 0,
                  fontFamily: 'Arial, sans-serif',
                  fontWeight: 'bold',
                  textShadow: '0px 1px 2px rgba(0, 0, 0, 0.5)',
                }}
              >
                {currentCaption.text}
              </p>
            </div>
          </AbsoluteFill>
        </Sequence>
      )}
      
      {/* Watermark */}
      <Sequence from={0}>
        <AbsoluteFill
          style={{
            justifyContent: 'flex-start',
            alignItems: 'flex-end',
            padding: 20,
          }}
        >
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              padding: '5px 10px',
              borderRadius: 4,
            }}
          >
            <p
              style={{
                color: 'white',
                fontSize: Math.max(12, Math.round(width / 50)),
                margin: 0,
                fontFamily: 'Arial, sans-serif',
                opacity: 0.8,
              }}
            >
              Created with YouTube Podcast Clipper
            </p>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
