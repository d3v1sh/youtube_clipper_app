import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { path: filePath } = req.query;
    
    if (!filePath || typeof filePath !== 'string') {
      return res.status(400).json({ error: 'Clip path is required' });
    }

    // Security check to prevent directory traversal
    const normalizedPath = path.normalize(filePath).replace(/^(\.\.(\/|\\|$))+/, '');
    
    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'Clip file not found' });
    }

    const stat = fs.statSync(normalizedPath);
    const fileSize = stat.size;
    const fileName = path.basename(normalizedPath);

    // Set appropriate headers
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Stream the file
    const fileStream = fs.createReadStream(normalizedPath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Error in download-clip API:', error);
    return res.status(500).json({ error: error.message || 'An error occurred while downloading clip' });
  }
}
