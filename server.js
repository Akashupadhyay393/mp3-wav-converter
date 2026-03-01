const express = require('express');
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');

const app = express();
const upload = multer({ dest: 'uploads/' });

ffmpeg.setFfmpegPath(ffmpegPath);

app.use(express.static(__dirname));

app.post('/convert', upload.single('audio'), (req, res) => {
    const inputPath = req.file.path;
    const outputPath = inputPath + '.wav';

    ffmpeg(inputPath)
        .toFormat('wav')
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