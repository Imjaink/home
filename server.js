const express = require('express');
const cors = require('cors');
const youtubedl = require('youtube-dl-exec');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors({
  origin: '*'
}));

app.use(express.json());

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ message: 'YouTube Downloader API is running' });
});

// Video info endpoint
app.get('/api/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Getting info for: ${url}`);
    
    // Use youtube-dl to get video info
    const options = {
      dumpSingleJson: true,
      noWarnings: true,
      noCallHome: true,
      noCheckCertificate: true,
      preferFreeFormats: true,
      youtubeSkipDashManifest: true
    };
    
    // If youtube-dl-exec has trouble, you can try the simpler approach
    // by just returning mock data for now
    const mockData = {
      title: 'Sample YouTube Video',
      description: 'This is a placeholder description for demonstration purposes.',
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
      format_options: {
        video: {
          mp4: ['720p', '480p', '360p', '240p']
        }
      }
    };
    
    res.json(mockData);
    
    // The commented code below would use youtube-dl-exec, but we're using
    // mock data instead to avoid rate limiting issues
    /*
    const info = await youtubedl(url, options);
    
    res.json({
      title: info.title,
      description: info.description?.substring(0, 200) + '...' || 'No description',
      thumbnail: info.thumbnail,
      format_options: {
        video: {
          mp4: ['720p', '480p', '360p', '240p']
        }
      }
    });
    */
    
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    res.status(500).json({ error: `Failed to fetch video info: ${error.message}` });
  }
});

// Start download endpoint
app.post('/api/start-download', (req, res) => {
  const { url, quality } = req.body;
  
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }
  
  // Create a download ID
  const downloadId = Date.now().toString(36);
  console.log(`Starting download ${downloadId} for ${url} with quality ${quality}`);
  
  res.json({ download_id: downloadId });
});

// Get download status
app.get('/api/get-download', (req, res) => {
  const { download_id } = req.query;
  
  if (!download_id) {
    return res.status(400).json({ error: 'Download ID is required' });
  }
  
  // Simulate progress
  const progress = Math.floor(Math.random() * 100);
  
  // Return a download URL when progress is complete
  if (progress > 70) {
    return res.json({ 
      download_url: 'https://example.com/sample-video.mp4',
      progress: 100
    });
  }
  
  res.json({ progress });
});

// Direct download endpoint for testing
app.get('/api/direct-download', (req, res) => {
  res.send('This would download the YouTube video (mock endpoint)');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});