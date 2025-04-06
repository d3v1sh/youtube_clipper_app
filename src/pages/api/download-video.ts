import { NextApiRequest, NextApiResponse } from 'next';
import { YouTubeFetcher } from '@/lib/youtube/fetcher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, options } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const youtubeService = new YouTubeFetcher();
    
    if (!youtubeService.isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const videoPath = await youtubeService.downloadVideo(url, options || {});
    
    if (!videoPath) {
      return res.status(500).json({ error: 'Failed to download video' });
    }

    return res.status(200).json({ 
      success: true, 
      videoPath,
      message: 'Video downloaded successfully' 
    });
  } catch (error: any) {
    console.error('Error in download-video API:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while downloading video' });
  }
}
