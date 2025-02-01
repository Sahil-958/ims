// config.js
export const config = {
  ALLOWED_EXTENSIONS: ["png", "jpg", "jpeg", "webp"],
  MAX_FILE_SIZE: 20 * 1024 * 1024, // 20MB
  PORT: process.env.PORT || 5100,
  HOST: process.env.HOST || "localhost",

  PIPELINE_MODELS: {
    CAPTION: {
      type: "image-to-text",
      name: "Xenova/vit-gpt2-image-captioning",
      options: { dtype: "fp32" },
    },
    OBJECT_DETECTION: {
      type: "object-detection",
      name: "Xenova/detr-resnet-50",
      options: { dtype: "fp32" },
    },
    EMOTION_DETECTION: {
      type: "image-classification",
      name: "Xenova/facial_emotions_image_detection",
      options: { dtype: "fp32" },
    },
    OCR: {
      type: "image-to-text",
      name: "Xenova/trocr-base-handwritten",
      options: { dtype: "fp32" },
    },
    UPSCALER: {
      type: "image-to-image",
      name: "Xenova/4x_APISR_GRL_GAN_generator-onnx",
      options: { dtype: "fp32" },
    },
  },
};
