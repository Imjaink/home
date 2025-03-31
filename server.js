const express = require("express");
const ytdl = require("ytdl-core");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.static("public"));
app.use(express.json());
app.use(cors({ origin: "*" })); // Allow all origins for testing; restrict in production

// Store active downloads (in-memory for simplicity)
const downloads = {};

// Root route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Get video info
app.get("/api/video-info", async (req, res) => {
  try {
    const url = req.query.url;
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const info = await ytdl.getInfo(url);
    const response = {
      title: info.videoDetails.title,
      description: info.videoDetails.shortDescription,
      image: info.videoDetails.thumbnails[0].url,
      format_options: {
        video: {
          mp4: ["360p", "720p", "1080p"] // Simplified; you can get real formats from info.formats
        },
        audio: {
          mp3: ["128kbps"]
        }
      }
    };
    res.json(response);
  } catch (error) {
    console.error("Video info error:", error);
    res.status(500).json({ error: "Failed to get video info" });
  }
});

// Start download
app.get("/api/start-download", async (req, res) => {
  try {
    const url = req.query.url;
    const quality = req.query.quality;
    if (!ytdl.validateURL(url)) {
      return res.status(400).json({ error: "Invalid YouTube URL" });
    }

    const downloadId = Date.now().toString();
    downloads[downloadId] = {
      url,
      quality,
      progress: 0,
      status: "starting",
      download_url: null
    };

    // Start download process (simplified - you'll need to implement actual file handling)
    ytdl(url, { quality: quality === "mp3" ? "highestaudio" : quality })
      .on("progress", (chunkLength, downloaded, total) => {
        downloads[downloadId].progress = (downloaded / total) * 100;
      })
      .on("end", () => {
        downloads[downloadId].status = "complete";
        downloads[downloadId].progress = 100;
        downloads[downloadId].download_url = "https://example.com/download.mp4"; // Replace with actual URL
      })
      .on("error", (err) => {
        downloads[downloadId].status = "error";
        console.error("Download error:", err);
      });

    res.json({ download_id: downloadId });
  } catch (error) {
    console.error("Start download error:", error);
    res.status(500).json({ error: "Failed to start download" });
  }
});

// Get download status
app.get("/api/get-download", (req, res) => {
  const downloadId = req.query.download_id;
  if (!downloads[downloadId]) {
    return res.status(404).json({ error: "Download not found" });
  }

  const download = downloads[downloadId];
  res.json({
    progress: download.progress,
    download_url: download.status === "complete" ? download.download_url : null
  });

  // Clean up completed downloads
  if (download.status === "complete") {
    delete downloads[downloadId];
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
