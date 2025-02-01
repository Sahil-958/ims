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

const { CAPTION, OBJECT_DETECTION, EMOTION_DETECTION, OCR, UPSCALER } =
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
  processFile(CAPTION, req, res, "Caption"),
);

router.post("/detect-obj", upload.single("file"), (req, res) =>
  processFile(OBJECT_DETECTION, req, res, "Object Detection"),
);

router.post("/detect-emo", upload.single("file"), (req, res) =>
  processFile(EMOTION_DETECTION, req, res, "Emotion Detection"),
);

router.post("/generate-ocr", upload.single("file"), (req, res) =>
  processFile(OCR, req, res, "OCR"),
);

router.post("/upscale", upload.single("file"), (req, res) =>
  processFile(UPSCALER, req, res, "OCR"),
);

export default router;
