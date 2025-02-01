// models.js

import { pipeline } from "@huggingface/transformers";
import { config } from "./config.js";

export const loadModels = async () => {
  try {
    const modelPromises = [];

    // Iterate over each model in the PIPELINE_MODELS object and create promises for each one
    for (const modelKey in config.PIPELINE_MODELS) {
      const model = config.PIPELINE_MODELS[modelKey];

      // Push each pipeline promise into the array
      modelPromises.push(
        pipeline(model.type, model.name, model.options).then((loadedModel) => {
          console.log(
            `Model ${model.name} of type ${model.type} loaded successfully!`,
          );
          return { [modelKey]: loadedModel };
        }),
      );
    }

    // Wait for all models to load in parallel
    const loadedModelsArray = await Promise.all(modelPromises);

    // Convert the array of results into an object
    const loadedModels = loadedModelsArray.reduce((acc, modelObj) => {
      return { ...acc, ...modelObj };
    }, {});

    console.log(loadedModels);

    console.log("All models loaded successfully!");
    return loadedModels;
  } catch (error) {
    console.error("Error loading models:", error);
    process.exit(1);
  }
};
