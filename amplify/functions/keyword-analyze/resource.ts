import { defineFunction } from "@aws-amplify/backend";
export const keywordAnalyzeFunction = defineFunction({
  name: "keyword-analyze",
  entry: "./handler.ts",
});
