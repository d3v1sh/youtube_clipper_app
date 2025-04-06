import { NextApiRequest, NextApiResponse } from 'next';
import { YouTubeFetcher } from '@/lib/youtube/fetcher';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'YouTube URL is required' });
    }

    const youtubeService = new YouTubeFetcher();
    
    if (!youtubeService.isValidYouTubeUrl(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }

    const videoInfo = await youtubeService.getVideoInfo(url);
    
    if (!videoInfo) {
      return res.status(404).json({ error: 'Could not fetch video information' });
    }

    return res.status(200).json({ success: true, videoInfo });
  } catch (error: any) {
    console.error('Error in fetch-video-info API:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while fetching video info' });
  }
}
