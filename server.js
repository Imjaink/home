const express = require("express");
const ytdl = require("ytdl-core");
const path = require("path");

const app = express();
const PORT = 3000;

// Serve the frontend HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// Route to download a YouTube video
app.get("/download", async (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl || !ytdl.validateURL(videoUrl)) {
        return res.status(400).send("Invalid YouTube URL.");
    }

    try {
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title.replace(/[^\w\s]/gi, ""); // Clean title

        res.header("Content-Disposition", `attachment; filename="${title}.mp4"`);
        res.header("Content-Type", "video/mp4");

        ytdl(videoUrl, { format: "mp4" }).pipe(res);
    } catch (error) {
        console.error(error);
        res.status(500).send("Error downloading the video.");
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});