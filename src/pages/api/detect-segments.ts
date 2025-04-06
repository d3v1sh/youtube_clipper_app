import { NextApiRequest, NextApiResponse } from 'next';
import { ViralContentDetector } from '@/lib/video/detector';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoPath } = req.body;
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }

    const detectorService = new ViralContentDetector();
    const segments = await detectorService.detectViralSegments(videoPath);
    
    if (!segments || segments.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'No viral segments detected in the video' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      segments,
      count: segments.length
    });
  } catch (error: any) {
    console.error('Error in detect-segments API:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while detecting viral segments' });
  }
}
