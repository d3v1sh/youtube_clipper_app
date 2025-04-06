import { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { clipId, startTime, endTime, videoUrl, captions } = req.body;
    
    if (!clipId || !startTime || !endTime || !videoUrl) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required parameters' 
      });
    }

    // Create a temporary directory for rendering
    const tempDir = path.join('/tmp', `clip_${clipId}_${Date.now()}`);
    await execAsync(`mkdir -p ${tempDir}`);

    // Create a Remotion render script
    const scriptPath = path.join(tempDir, 'render.js');
    const outputPath = path.join(tempDir, `clip_${clipId}.mp4`);
    
    const renderScript = `
      const { bundle } = require('@remotion/bundler');
      const { getCompositions, renderMedia } = require('@remotion/renderer');
      const path = require('path');

      const start = async () => {
        // Create a bundler
        const bundleLocation = await bundle({
          entryPoint: path.join(process.cwd(), 'src/components/VideoComposition.tsx'),
          // You can pass custom Webpack overrides here
        });

        // Extract all compositions from the bundle
        const compositions = await getCompositions(bundleLocation);
        
        // Select the composition you want to render
        const composition = compositions.find(
          (c) => c.id === 'VideoComposition'
        );
        
        if (!composition) {
          throw new Error('No composition found');
        }

        // Render the video
        await renderMedia({
          composition,
          serveUrl: bundleLocation,
          codec: 'h264',
          outputLocation: '${outputPath}',
          inputProps: {
            videoUrl: '${videoUrl}',
            captions: ${JSON.stringify(captions || [])},
            startTime: ${startTime},
            endTime: ${endTime},
          },
          durationInFrames: Math.round((${endTime} - ${startTime}) * 30),
          fps: 30,
          width: 1280,
          height: 720,
        });
        
        console.log('Render complete');
      };

      start()
        .then(() => process.exit(0))
        .catch((err) => {
          console.error(err);
          process.exit(1);
        });
    `;

    // Write the render script
    fs.writeFileSync(scriptPath, renderScript);

    // Execute the render script
    await execAsync(`cd ${process.cwd()} && node ${scriptPath}`);

    // Check if the output file exists
    if (!fs.existsSync(outputPath)) {
      return res.status(500).json({ 
        success: false, 
        message: 'Failed to render video' 
      });
    }

    // Set headers for file download
    res.setHeader('Content-Disposition', `attachment; filename="viral_clip_${clipId}.mp4"`);
    res.setHeader('Content-Type', 'video/mp4');

    // Stream the file
    const fileStream = fs.createReadStream(outputPath);
    fileStream.pipe(res);

    // Clean up after streaming is complete
    fileStream.on('end', () => {
      try {
        fs.unlinkSync(outputPath);
        fs.unlinkSync(scriptPath);
        fs.rmdirSync(tempDir);
      } catch (error) {
        console.error('Error cleaning up:', error);
      }
    });
  } catch (error) {
    console.error('Error rendering clip:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error rendering clip',
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
