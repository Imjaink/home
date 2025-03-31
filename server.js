const express = require('express');
const cors = require('cors');
const ytdl = require('@distube/ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for all routes
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ message: 'YouTube Downloader API is running' });
});

// Video info endpoint with better error handling
app.get('/api/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Getting info for: ${url}`);
    
    // Check if URL is valid YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get video info using ytdl-core
    const info = await ytdl.getInfo(url);
    
    // Extract available formats
    const formats = info.formats.filter(format => format.hasVideo && format.hasAudio);
    
    // Create quality options
    const qualities = [];
    if (formats.length > 0) {
      // Add available qualities
      const qualitySet = new Set();
      formats.forEach(format => {
        if (format.qualityLabel) {
          qualitySet.add(format.qualityLabel);
        }
      });
      qualities.push(...Array.from(qualitySet));
    } else {
      // Fallback qualities if none are found
      qualities.push('720p', '480p', '360p');
    }
    
    // Prepare response
    res.json({
      title: info.videoDetails.title,
      description: info.videoDetails.description?.substring(0, 200) + '...' || 'No description',
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      format_options: {
        video: {
          mp4: qualities
        }
      }
    });
    
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    
    // Send specific error message
    if (error.message.includes('410')) {
      return res.status(500).json({ 
        error: 'YouTube API restrictions prevented this download. Try another video.' 
      });
    }
    
    res.status(500).json({ error: `Failed to fetch video info: ${error.message}` });
  }
});

// Simple start download endpoint
app.post('/api/start-download', (req, res) => {
  const { url, quality } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Just create a download ID
  const downloadId = Date.now().toString(36);
  console.log(`Starting download ${downloadId} for ${url} with quality ${quality}`);
  
  res.json({ download_id: downloadId });
});

// Simple get download status
app.get('/api/get-download', (req, res) => {
  const { download_id } = req.query;
  
  if (!download_id) {
    return res.status(400).json({ error: 'Download ID is required' });
  }
  
  // For now, just simulate progress
  const progress = Math.floor(Math.random() * 100);
  
  // For testing, return a download URL after a certain progress
  if (progress > 70) {
    return res.json({ 
      download_url: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`,
      progress: 100
    });
  }
  
  res.json({ progress });
});

// Direct download endpoint for testing
app.get('/api/direct-download', (req, res) => {
  const { url, quality } = req.query;
  
  if (!url) {
    return res.status(400).send('URL is required');
  }
  
  res.send(`This would download the video: ${url} with quality ${quality}`);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});