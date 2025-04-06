import { NextApiRequest, NextApiResponse } from 'next';
import { VideoClipper } from '@/lib/video/clipper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { videoPath, segments, baseFilename } = req.body;
    
    if (!videoPath) {
      return res.status(400).json({ error: 'Video path is required' });
    }
    
    if (!segments || !Array.isArray(segments) || segments.length === 0) {
      return res.status(400).json({ error: 'Valid segments array is required' });
    }

    const clipperService = new VideoClipper();
    const results = await clipperService.clipMultipleSegments(
      videoPath,
      segments,
      baseFilename
    );
    
    if (!results || results.length === 0) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to generate clips' 
      });
    }

    return res.status(200).json({ 
      success: true, 
      clips: results,
      count: results.length
    });
  } catch (error: any) {
    console.error('Error in generate-clips API:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while generating clips' });
  }
}
