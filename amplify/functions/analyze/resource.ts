import { defineFunction } from "@aws-amplify/backend";

export const analyzeFunction = defineFunction({
  name: "analyze",
  entry: "./handler.ts",
});
