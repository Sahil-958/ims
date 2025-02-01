import express from "express";
import multer from "multer";
import { allowedFileType, removeUploadedFile } from "./utils.js";
import { loadModels } from "./models.js";

const router = express.Router();
const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 20 * 1024 * 1024 },
});

let models;

try {
  // Wait for all models to load
  models = await loadModels();
  console.log("Models loaded successfully!");

  // Now define routes dynamically based on loaded models
  Object.keys(models).forEach((modelKey) => {
    router.post(
      `/${modelKey.toLowerCase()}`,
      upload.single("file"),
      (req, res) => {
        const model = models[modelKey];
        processFile(model, req, res, modelKey);
      },
    );
  });
} catch (error) {
  console.error("Error loading models:", error);
  process.exit(1);
}

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

// Custom route to return all implemented routes
router.get("/routes", (req, res) => {
  const routeList = [];

  // Iterate over the stack of routes
  router.stack.forEach((middleware) => {
    if (middleware.route) {
      // For routes with a path, add their method and path to the list
      routeList.push({
        method: Object.keys(middleware.route.methods).join(", ").toUpperCase(),
        path: middleware.route.path,
      });
    }
  });

  res.json(routeList);
});
export default router;
