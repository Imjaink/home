// server.js
const express = require('express');
const ytdl = require('ytdl-core'); // Free library to download YouTube videos
const path = require('path');
const app = express();
const port = 3000; // Port where the server will run

// Middleware to serve static files (like index.html)
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Route to handle video download requests
 * Accepts a YouTube URL via query parameter and streams the video as a downloadable file
 */
app.get('/download', async (req, res) => {
  try {
    const videoUrl = req.query.url; // Get the YouTube URL from query parameter

    // Validate the URL
    if (!ytdl.validateURL(videoUrl)) {
      return res.status(400).send('Invalid YouTube URL');
    }

    // Fetch video info to get the title for the file name
    const info = await ytdl.getInfo(videoUrl);
    const videoTitle = info.videoDetails.title
      .replace(/[^\w\s]/gi, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores
    const fileName = `${videoTitle}.mp4`;

    // Set headers to trigger file download in the browser
    res.header('Content-Disposition', `attachment; filename="${fileName}"`);
    res.header('Content-Type', 'video/mp4');

    // Stream the video directly to the response
    ytdl(videoUrl, {
      format: 'mp4', // Download in MP4 format
      quality: 'highestvideo', // Get the highest video quality available
    }).pipe(res); // Pipe the video stream to the HTTP response

  } catch (error) {
    console.error('Error downloading video:', error.message); // Log the error for debugging
    res.status(500).send('Failed to download video. Please try again.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});