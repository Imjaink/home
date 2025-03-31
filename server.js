const express = require('express');
const cors = require('cors');
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

// Video info endpoint with mock data
app.get('/api/video-info', (req, res) => {
  // Just return mock data regardless of the URL
  const mockData = {
    title: 'Sample YouTube Video',
    description: 'This is a sample description for a YouTube video. It demonstrates how the YouTube downloader would display information.',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    format_options: {
      video: {
        mp4: ['1080p', '720p', '480p', '360p', '240p']
      }
    }
  };
  
  res.json(mockData);
});

// Start download endpoint
app.post('/api/start-download', (req, res) => {
  // Generate a random download ID
  const downloadId = Math.random().toString(36).substring(2, 15);
  
  res.json({ download_id: downloadId });
});

// Get download status
app.get('/api/get-download', (req, res) => {
  const { download_id } = req.query;
  
  // Simulate download progress (random percentage)
  const progress = Math.floor(Math.random() * 100);
  
  // If progress is high enough, return a mock download URL
  if (progress > 70) {
    res.json({ 
      download_url: 'https://example.com/sample-video.mp4',
      progress: 100
    });
  } else {
    res.json({ progress });
  }
});

// Direct download endpoint
app.get('/api/direct-download', (req, res) => {
  res.send('This would download the YouTube video (mock endpoint)');
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});