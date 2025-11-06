import { defineFunction } from "@aws-amplify/backend";
export const denoiseFunction = defineFunction({
  name: "denoise",
  entry: "./handler.ts",
});
