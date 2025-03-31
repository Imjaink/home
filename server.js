const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (if needed)
app.use(express.static("public"));

// Basic route
app.get("/", (req, res) => {
  res.send("Server is running!");
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
