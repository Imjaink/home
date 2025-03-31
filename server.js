const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS
app.use(cors());
app.use(express.json());

// Root endpoint for testing
app.get('/', (req, res) => {
  res.json({ message: 'YouTube Downloader API is running!' });
});

// Video info endpoint
app.get('/api/video-info', async (req, res) => {
  try {
    const { url } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    const info = await ytdl.getInfo(url);
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const qualities = [...new Set(formats.map(f => f.qualityLabel))].filter(Boolean);
    
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
    console.error('Error fetching video info:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start download endpoint (simplified for testing)
app.post('/api/start-download', (req, res) => {
  const { url, quality } = req.body;
  const downloadId = Date.now().toString(36);
  
  // Just return a download ID for now
  res.json({ download_id: downloadId });
});

// Get download status (simplified for testing)
app.get('/api/get-download', (req, res) => {
  const { download_id } = req.query;
  
  // Simulate progress
  const progress = Math.floor(Math.random() * 100);
  
  if (progress >= 100) {
    res.json({ 
      download_url: `/api/download/${download_id}`,
      progress: 100
    });
  } else {
    res.json({ progress });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});