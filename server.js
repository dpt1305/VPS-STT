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

function modelReadAudio(path) {
  const DeepSpeech = require("deepspeech");
  // const Sox = require("sox-stream");
  // const MemoryStream = require("memory-stream");
  // const Duplex = require("stream").Duplex;
  const wav = require("node-wav");

  let modelPath = "./models/deepspeech-0.9.3-models.pbmm";

  let model = new DeepSpeech.Model(modelPath);

  let desiredSampleRate = model.sampleRate();

  let scorerPath = "./models/deepspeech-0.9.3-models.scorer";

  model.enableExternalScorer(scorerPath);

  // const result = Wav.decode(buffer);

  // if (result.sampleRate < desiredSampleRate) {
  //   console.error(
  //     "Warning: original sample rate (" +
  //       result.sampleRate +
  //       ") is lower than " +
  //       desiredSampleRate +
  //       "Hz. Up-sampling might produce erratic speech recognition."
  //   );
  // }

  function bufferToStream(buffer) {
    let stream = new Duplex();
    stream.push(buffer);
    stream.push(null);
    return stream;
  }
  let buffer = fs.readFileSync(path);
  // let result = wav.decode(buffer);
  // console.log(buffer);
  
  // let audioStream = new MemoryStream();
  // let audioStream = buffer;
  let result = model.stt(buffer);
  console.log("result:", result);
  return result;
  // bufferToStream(buffer)
  //   .pipe(
  //     Sox({
  //       global: {
  //         "no-dither": true,
  //       },
  //       output: {
  //         bits: 16,
  //         rate: desiredSampleRate,
  //         channels: 1,
  //         encoding: "signed-integer",
  //         endian: "little",
  //         compression: 0.0,
  //         type: "raw",
  //       },
  //     })
  //   )
  //   .pipe(audioStream);

  // audioStream.on("close", () => {
  //   let audioBuffer = audioStream.toBuffer();

  //   const audioLength = (audioBuffer.length / 2) * (1 / desiredSampleRate);
  //   console.log("audio length", audioLength);

  //   let result = model.stt(audioBuffer);
  //   console.log("result:", result);

  //   return result;
  // });
}

app.post("/uploadfile", upload.single("file"), (req, res, next) => {
  const file = req.file;
  // var img = fs.readFile(req.file.path);
  if (!file) {
    const error = new Error("Please upload a file");
    error.httpStatusCode = 400;
    return next(error);
  }
  const result = modelReadAudio(file.path);
  res.send(result);
});
// app.get("/uploadfile", (req, res) => {
//   file.on("data", (chunk) => {
//     // Send chunk to client
//     res.send(chunk); // May be?
//   });
// });
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
