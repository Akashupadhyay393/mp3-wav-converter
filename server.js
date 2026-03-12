const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

ffmpeg.setFfmpegPath(ffmpegPath);

// Serve frontend from public folder
app.use(express.static('public'));

app.post('/convert', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const inputPath = req.file.path;
  const outputPath = inputPath + '.wav';

  // Use defaults if not provided
  const sampleRate = req.body.sampleRate || 44100;
  const bitDepth = req.body.bitDepth || "16";
  const channels = req.body.channels || 2;

  let codec;
  if (bitDepth === "16") codec = "pcm_s16le";
  else if (bitDepth === "24") codec = "pcm_s24le";
  else if (bitDepth === "32") codec = "pcm_s32le";
  else codec = "pcm_s16le"; // default fallback

  ffmpeg(inputPath)
    .audioFrequency(Number(sampleRate))
    .audioChannels(Number(channels))
    .audioCodec(codec)
    .format('wav')
    .on('end', () => {
      res.download(outputPath, 'converted.wav', (err) => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
        if (err) console.error('Download error:', err);
      });
    })
    .on('error', (err) => {
      console.error('Conversion error:', err);
      res.status(500).send('Conversion error');
      // Cleanup on error
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    })
    .save(outputPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
