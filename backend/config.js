// config.js
export const config = {
  ALLOWED_EXTENSIONS: ["png", "jpg", "jpeg", "webp"],
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  PORT: process.env.PORT || 5100,
  HOST: process.env.HOST || "localhost",
  MODELS: {
    CAPTION: "Xenova/vit-gpt2-image-captioning",
    OBJECT_DETECTION: "Xenova/detr-resnet-50",
    EMOTION_DETECTION: "Xenova/facial_emotions_image_detection",
    OCR: "Xenova/trocr-base-handwritten",
  },
};
