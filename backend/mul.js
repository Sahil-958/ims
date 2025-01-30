import multer from "multer";
import express from "express";
import cors from "cors";
import { pipeline } from "@huggingface/transformers";
import fs from "fs";

const app = express();
app.use(cors());
const port = 5000;
const host = "127.0.0.1";

// Constants
const ALLOWED_EXTENSIONS = ["png", "jpg", "jpeg", "gif"];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 10MB

// File upload setup using multer
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: MAX_FILE_SIZE },
});

// Load the models using @xenova/transformers
let classifier;
let ocrModel;
let objDetector;
let emoDetector;
(async () => {
  try {
    classifier = await pipeline(
      "image-to-text",
      "Xenova/vit-gpt2-image-captioning",
      //"Mozilla/distilvit",
      {
        quantized: false,
      },
    );
    console.log("Captioning model loaded successfully!");

    objDetector = await pipeline(
      "object-detection",
      //"Xenova/gelan-c_all",
      "Xenova/detr-resnet-50",
    );
    console.log("Object Detection model loaded successfully!");

    emoDetector = await pipeline(
      "image-classification",
      "Xenova/facial_emotions_image_detection",
    );
    console.log("Emotion Detection model loaded successfully!");

    ocrModel = await pipeline(
      "image-to-text",
      // "Xenova/donut-base-finetuned-cord-v2",
      "Xenova/trocr-base-handwritten",
      //"Xenova/trocr-small-handwritten",
    );
    console.log("OCR model loaded successfully!");
  } catch (e) {
    console.error("Error loading models:", e);
    process.exit(1);
  }
})();

// Helper function to check allowed file type
function allowedFileType(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
}

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "healthy" });
});

// Image caption generation route
app.post("/generate-caption", upload.single("file"), async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!allowedFileType(req.file.originalname)) {
    return res.status(400).json({
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
    });
  }

  try {
    // Run the caption model on the image
    const captionOutput = await classifier(
      req.file.path,
      {
        top_k: 50,
        max_length: 50,
      },
      (progress) => console.log("Progress:", progress),
    );

    console.log(captionOutput);

    // Remove the file from uploads
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error removing file:", err);
    });

    res.json({
      text: captionOutput[0].generated_text,
      status: "success",
    });
  } catch (e) {
    console.error("Error processing image:", e);
    res.status(500).json({
      error:
        "Failed to process image. Please try again with a different image.",
      details: e.message,
    });
  }
});

// Image caption generation route
app.post("/detect-obj", upload.single("file"), async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!allowedFileType(req.file.originalname)) {
    return res.status(400).json({
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
    });
  }

  try {
    // Run the caption model on the image
    const objOutput = await objDetector(
      req.file.path,
      { threshold: 0.9 },
      (progress) => console.log("Progress:", progress),
    );

    console.log(objOutput);

    // Remove the file from uploads
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error removing file:", err);
    });

    res.json(objOutput);
  } catch (e) {
    console.error("Error processing image:", e);
    res.status(500).json({
      error:
        "Failed to process image. Please try again with a different image.",
      details: e.message,
    });
  }
});

app.post("/detect-emo", upload.single("file"), async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!allowedFileType(req.file.originalname)) {
    return res.status(400).json({
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
    });
  }

  try {
    // Run the caption model on the image
    const emoOutput = await emoDetector(
      req.file.path,
      { threshold: 0.9 },
      (progress) => console.log("Progress:", progress),
    );

    console.log(emoOutput);

    // Remove the file from uploads
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error removing file:", err);
    });

    res.json(emoOutput);
  } catch (e) {
    console.error("Error processing image:", e);
    res.status(500).json({
      error:
        "Failed to process image. Please try again with a different image.",
      details: e.message,
    });
  }
});

// OCR processing route
app.post("/generate-ocr", upload.single("file"), async (req, res) => {
  console.log(req.file);
  if (!req.file) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  if (!allowedFileType(req.file.originalname)) {
    return res.status(400).json({
      error: `Invalid file type. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`,
    });
  }

  try {
    // Run the OCR model on the image
    const ocrOutput = await ocrModel(req.file.path, (progress) =>
      console.log("Progress:", progress),
    );

    console.log("OCR Output:", ocrOutput);

    // Remove the file from uploads
    fs.unlink(req.file.path, (err) => {
      if (err) console.error("Error removing file:", err);
    });

    res.json({
      text: ocrOutput[0].generated_text, // Assuming the OCR model outputs text
      status: "success",
    });
  } catch (e) {
    console.error("Error processing image:", e);
    res.status(500).json({
      error:
        "Failed to process image. Please try again with a different image.",
      details: e.message,
    });
  }
});

// Start the server
app.listen(port, host, () => {
  console.log(`Server running at http://${host}:${port}`);
});
