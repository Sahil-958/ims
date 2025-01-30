// utils.js
import fs from "fs";
import { config } from "./config.js";

export const allowedFileType = (filename) => {
  const ext = filename.split(".").pop().toLowerCase();
  return config.ALLOWED_EXTENSIONS.includes(ext);
};

export const removeUploadedFile = (path) => {
  fs.unlink(path, (err) => {
    if (err) console.error("Error removing file:", err);
  });
};
