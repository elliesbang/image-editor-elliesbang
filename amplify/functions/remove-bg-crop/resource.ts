import { defineFunction } from "@aws-amplify/backend";

export const removeBgCropFunction = defineFunction({
  name: "remove-bg-crop",
  entry: "./handler.ts",
});
