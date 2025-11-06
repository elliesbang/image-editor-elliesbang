import { defineFunction } from "@aws-amplify/backend";
export const cropFunction = defineFunction({
  name: "crop",
  entry: "./handler.ts",
});
