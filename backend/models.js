// models.js
import { pipeline, AutoImageProcessor } from "@huggingface/transformers";
import { config } from "./config.js";

export const loadModels = async () => {
  try {
    const captionModel = await pipeline(
      "image-to-text",
      config.MODELS.CAPTION,
      { quantized: false },
    );
    const objectDetectionModel = await pipeline(
      "object-detection",
      config.MODELS.OBJECT_DETECTION,
    );
    const emotionDetectionModel = await pipeline(
      "image-classification",
      config.MODELS.EMOTION_DETECTION,
    );
    const ocrModel = await pipeline("image-to-text", config.MODELS.OCR);
    console.log("All models loaded successfully!");

    return {
      captionModel,
      objectDetectionModel,
      emotionDetectionModel,
      ocrModel,
    };
  } catch (error) {
    console.error("Error loading models:", error);
    process.exit(1);
  }
};
