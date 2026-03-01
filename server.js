const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

ffmpeg.setFfmpegPath(ffmpegPath);

// Serve frontend
app.use(express.static(__dirname));

// Convert route
app.post('/convert', upload.single('audio'), (req, res) => {
  const inputPath = req.file.path;
  const outputPath = inputPath + '.wav';

  const sampleRate = req.body.sampleRate; // e.g., 44100
  const bitDepth = req.body.bitDepth;     // 16, 24, 32
  const channels = req.body.channels;     // 1 = Mono, 2 = Stereo

  let codec;
  if (bitDepth === "16") codec = "pcm_s16le";
  if (bitDepth === "24") codec = "pcm_s24le";
  if (bitDepth === "32") codec = "pcm_s32le";

  ffmpeg(inputPath)
    .audioFrequency(sampleRate)
    .audioChannels(channels)
    .audioCodec(codec)
    .format('wav')
    .on('end', () => {
      res.download(outputPath, 'converted.wav', () => {
        fs.unlinkSync(inputPath);
        fs.unlinkSync(outputPath);
      });
    })
    .on('error', (err) => {
      console.error(err);
      res.status(500).send('Conversion error');
    })
    .save(outputPath);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
