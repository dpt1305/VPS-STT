const express = require("express");
const app = express();
const port = 3000;
var path = require("path"); //used for file path
var fs = require("fs-extra");
const bodyParser = require("body-parser");
const multer = require("multer");

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World!");
});

// upload file
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./audios");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});
var upload = multer({ storage: storage });

function modelReadAudio(req, res) {
  const DeepSpeech = require("deepspeech");
  const Fs = require("fs-extra");
  const Sox = require("sox-stream");
  const MemoryStream = require("memory-stream");
  const Duplex = require("stream").Duplex;
  const Wav = require("node-wav");

  let modelPath = "./models/deepspeech-0.9.3-models.pbmm";

  let model = new DeepSpeech.Model(modelPath);

  let desiredSampleRate = model.sampleRate();

  let scorerPath = "./models/deepspeech-0.9.3-models.scorer";

  model.enableExternalScorer(scorerPath);

  console.log(req.file);
  let audioFile = req.file.path;

  if (!Fs.existsSync(audioFile)) {
    console.log("file missing:", audioFile);
    process.exit();
  }

  const buffer = Fs.readFileSync(audioFile);
  const result = Wav.decode(buffer);

  if (result.sampleRate < desiredSampleRate) {
    console.error(
      "Warning: original sample rate (" +
        result.sampleRate +
        ") is lower than " +
        desiredSampleRate +
        "Hz. Up-sampling might produce erratic speech recognition."
    );
  }

  function bufferToStream(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }

  let audioStream = new MemoryStream();
  bufferToStream(buffer)
    .pipe(
      Sox({
        global: {
          "no-dither": true,
        },
        input: {
          volume: 0.85,
        },
        output: {
          bits: 16,
          rate: desiredSampleRate,
          channels: 1,
          encoding: "signed-integer",
          endian: "little",
          compression: 0.0,
          type: "raw",
        },
      })
    )
    .pipe(audioStream);
  var result1;
  audioStream.on("finish", async  () => {
    let audioBuffer = audioStream.toBuffer();

    const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate);

    result1 = model.stt(audioBuffer);
    console.log("result:", result1);
    res.status(200).json({
      data: result1,
      message: 'Success',
    });
  });
}

app.post("/uploadfile", upload.single("file"),  (req, res, next) => {
  const result = modelReadAudio(req, res);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
