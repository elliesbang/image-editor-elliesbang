import { defineFunction } from "@aws-amplify/backend";
export const removeBgFunction = defineFunction({
  name: "remove-bg",
  entry: "./handler.ts",
});
