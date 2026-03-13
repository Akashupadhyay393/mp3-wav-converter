const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

// Set FFmpeg binary path
ffmpeg.setFfmpegPath(ffmpegPath);

// Serve frontend from public folder
app.use(express.static('public'));

app.post('/convert', upload.single('audio'), (req, res) => {
  if (!req.file) return res.status(400).send('No file uploaded');

  const inputPath = req.file.path;

  // Get user settings from frontend
  const format = req.body.format || 'wav';
  const sampleRate = req.body.sampleRate || 'original';
  const bitDepth = req.body.bitDepth || '16';
  const channels = req.body.channels || 'original';

  const outputName = path.parse(req.file.originalname).name + '.' + format;
  const outputPath = path.join('uploads', outputName);

  // Choose codec based on bit depth if WAV, fallback defaults
  let codec;
  if (format === 'wav') {
    if (bitDepth === '16') codec = 'pcm_s16le';
    else if (bitDepth === '24') codec = 'pcm_s24le';
    else if (bitDepth === '32') codec = 'pcm_s32le';
    else codec = 'pcm_s16le';
  }

  let command = ffmpeg(inputPath).format(format);

  // Apply codec only for WAV
  if (codec) command.audioCodec(codec);

  // Channels
  if (channels !== 'original') {
    if (channels === 'mono') command.audioChannels(1);
    if (channels === 'stereo') command.audioChannels(2);
  }

  // Sample rate
  if (sampleRate !== 'original') {
    command.audioFrequency(Number(sampleRate));
  }

  command
    .on('end', () => {
      res.download(outputPath, outputName, (err) => {
        // Cleanup files
        if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
        if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
        if (err) console.error('Download error:', err);
      });
    })
    .on('error', (err) => {
      console.error('Conversion error:', err);
      res.status(500).send('Conversion error');
      if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    })
    .save(outputPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
