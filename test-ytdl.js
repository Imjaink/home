const ytdl = require('ytdl-core');

// Test function to verify ytdl-core is working
async function testYoutubeAPI() {
  try {
    console.log('Testing ytdl-core...');
    console.log('ytdl-core version:', ytdl.version);
    
    const videoURL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'; // A very stable video
    console.log('Validating URL:', videoURL);
    
    const isValid = ytdl.validateURL(videoURL);
    console.log('URL valid:', isValid);
    
    if (isValid) {
      console.log('Fetching video info...');
      const info = await ytdl.getInfo(videoURL);
      console.log('Successfully fetched info for:', info.videoDetails.title);
      console.log('Video length:', info.videoDetails.lengthSeconds, 'seconds');
      console.log('Available formats:', info.formats.length);
      
      // Print some format details
      console.log('\nSample formats:');
      info.formats.slice(0, 3).forEach((format, i) => {
        console.log(`Format ${i+1}: Quality: ${format.qualityLabel || 'Audio'}, Type: ${format.mimeType}`);
      });
      
      console.log('\nTest SUCCESSFUL! ytdl-core is working correctly.');
    }
  } catch (error) {
    console.error('TEST FAILED!');
    console.error('Error:', error.message);
    console.error(error);
  }
}

// Run the test
testYoutubeAPI();