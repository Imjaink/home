const express = require('express');
const cors = require('cors');
const ytdl = require('ytdl-core');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Store downloads in memory
const downloads = {};

// Enable CORS with detailed configuration
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Create downloads directory
const downloadDir = path.join(__dirname, 'downloads');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
}

// Root endpoint
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
    
    // Validate YouTube URL
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: 'Invalid YouTube URL' });
    }
    
    // Get video info
    const info = await ytdl.getInfo(url);
    
    // Format the response
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    
    // Get unique quality labels
    const qualities = [...new Set(formats.map(f => f.qualityLabel))]
      .filter(Boolean)
      .sort((a, b) => {
        // Sort by resolution (highest first)
        const aRes = parseInt(a.match(/\d+/)[0]);
        const bRes = parseInt(b.match(/\d+/)[0]);
        return bRes - aRes;
      });
    
    res.json({
      title: info.videoDetails.title,
      description: info.videoDetails.description?.substring(0, 200) + '...' || 'No description',
      thumbnail: info.videoDetails.thumbnails[info.videoDetails.thumbnails.length - 1].url,
      format_options: {
        video: {
          mp4: qualities.length > 0 ? qualities : ['720p', '480p', '360p']
        }
      },
      videoId: info.videoDetails.videoId
    });
    
  } catch (error) {
    console.error('Error fetching video info:', error.message);
    res.status(500).json({ error: `Failed to fetch video info: ${error.message}` });
  }
});

// Start download endpoint
app.post('/api/start-download', async (req, res) => {
  try {
    const { url, quality } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log(`Starting download for ${url} with quality ${quality}`);
    
    // Generate a unique download ID
    const downloadId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Store initial status
    downloads[downloadId] = {
      progress: 0,
      complete: false,
      started: Date.now(),
      error: null
    };
    
    // Start the download process in the background
    downloadVideo(url, quality, downloadId);
    
    res.json({ download_id: downloadId });
    
  } catch (error) {
    console.error('Error starting download:', error.message);
    res.status(500).json({ error: `Failed to start download: ${error.message}` });
  }
});

// Get download status
app.get('/api/get-download', (req, res) => {
  const { download_id } = req.query;
  
  if (!download_id || !downloads[download_id]) {
    return res.status(404).json({ error: 'Download not found' });
  }
  
  const download = downloads[download_id];
  
  if (download.error) {
    return res.status(500).json({ error: download.error });
  }
  
  if (download.complete) {
    // Return download URL when complete
    const downloadUrl = `/api/download/${download_id}`;
    return res.json({ 
      download_url: downloadUrl,
      progress: 100,
      filename: download.fileName 
    });
  }
  
  // Return progress
  res.json({ progress: download.progress });
});

// Download file endpoint
app.get('/api/download/:downloadId', (req, res) => {
  const downloadId = req.params.downloadId;
  
  if (!downloadId || !downloads[downloadId] || !downloads[downloadId].complete) {
    return res.status(404).send('Download not found or not complete');
  }
  
  const download = downloads[downloadId];
  
  res.download(download.filePath, download.fileName, (err) => {
    if (err) {
      console.error('Download error:', err);
      res.status(500).send('Error downloading file');
    }
    
    // After successful download, schedule file for deletion
    setTimeout(() => {
      if (fs.existsSync(download.filePath)) {
        try {
          fs.unlinkSync(download.filePath);
          console.log(`Deleted file: ${download.filePath}`);
        } catch (err) {
          console.error(`Failed to delete file: ${download.filePath}`, err);
        }
      }
    }, 5 * 60 * 1000); // 5 minutes
  });
});

// Helper function to download video
async function downloadVideo(url, requestedQuality, downloadId) {
  try {
    // Get video info
    const info = await ytdl.getInfo(url);
    const videoTitle = info.videoDetails.title.replace(/[^\w\s]/gi, '_');
    const outputPath = path.join(downloadDir, `${videoTitle}-${downloadId}.mp4`);
    
    // Find the format that matches the requested quality
    const formats = ytdl.filterFormats(info.formats, 'videoandaudio');
    const format = formats.find(f => f.qualityLabel === requestedQuality) || 
                   formats.sort((a, b) => Number(b.height) - Number(a.height))[0];
    
    if (!format) {
      downloads[downloadId].error = 'No suitable format found';
      return;
    }
    
    // Start download
    const video = ytdl(url, { quality: format.itag });
    const fileStream = fs.createWriteStream(outputPath);
    
    let totalBytes = 0;
    let downloadedBytes = 0;
    
    video.on('info', (info, format) => {
      totalBytes = format.contentLength;
    });
    
    video.on('data', (chunk) => {
      downloadedBytes += chunk.length;
      
      if (totalBytes > 0) {
        const progress = Math.floor((downloadedBytes / totalBytes) * 100);
        downloads[downloadId].progress = progress;
      } else {
        // If we don't have total size, estimate progress
        downloads[downloadId].progress = Math.min(
          Math.floor((downloadedBytes / (10 * 1024 * 1024)) * 100), 
          99
        );
      }
    });
    
    video.on('end', () => {
      downloads[downloadId].complete = true;
      downloads[downloadId].progress = 100;
      downloads[downloadId].filePath = outputPath;
      downloads[downloadId].fileName = `${videoTitle}.mp4`;
      console.log(`Download complete: ${outputPath}`);
    });
    
    video.on('error', (error) => {
      console.error(`Download error for ${downloadId}:`, error);
      downloads[downloadId].error = error.message;
    });
    
    // Pipe download stream to file
    video.pipe(fileStream);
    
  } catch (error) {
    console.error(`Error in download process: ${error.message}`);
    downloads[downloadId].error = error.message;
  }
}

// Cleanup old downloads every hour
setInterval(() => {
  const now = Date.now();
  const ONE_HOUR = 60 * 60 * 1000;
  
  Object.entries(downloads).forEach(([id, download]) => {
    if (now - download.started > ONE_HOUR) {
      // Remove file if it exists
      if (download.filePath && fs.existsSync(download.filePath)) {
        try {
          fs.unlinkSync(download.filePath);
          console.log(`Deleted file: ${download.filePath}`);
        } catch (err) {
          console.error(`Failed to delete file: ${download.filePath}`, err);
        }
      }
      // Remove from tracking
      delete downloads[id];
      console.log(`Cleaned up download: ${id}`);
    }
  });
}, 60 * 60 * 1000);

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});