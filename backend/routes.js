// routes.js
import express from "express";
import multer from "multer";
import { allowedFileType, removeUploadedFile } from "./utils.js";
import { loadModels } from "./models.js";

const router = express.Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 },
});

const { captionModel, objectDetectionModel, emotionDetectionModel, ocrModel } =
  await loadModels();

const processFile = (model, req, res, type) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });

  if (!allowedFileType(req.file.originalname)) {
    return res.status(400).json({
      error: `Invalid file type. Allowed types: ${allowedFileType.join(", ")}`,
    });
  }

  model(req.file.path)
    .then((output) => {
      console.log(`${type} Output:`, output);
      removeUploadedFile(req.file.path);
      res.json(output);
    })
    .catch((e) => {
      console.error(`Error processing ${type}:`, e);
      res
        .status(500)
        .json({ error: `Failed to process image. Please try again.` });
      removeUploadedFile(req.file.path);
    });
};

router.post("/generate-caption", upload.single("file"), (req, res) =>
  processFile(captionModel, req, res, "Caption"),
);

router.post("/detect-obj", upload.single("file"), (req, res) =>
  processFile(objectDetectionModel, req, res, "Object Detection"),
);

router.post("/detect-emo", upload.single("file"), (req, res) =>
  processFile(emotionDetectionModel, req, res, "Emotion Detection"),
);

router.post("/generate-ocr", upload.single("file"), (req, res) =>
  processFile(ocrModel, req, res, "OCR"),
);

export default router;
