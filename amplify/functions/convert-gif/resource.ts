import { defineFunction } from "@aws-amplify/backend";

export const convertGifFunction = defineFunction({
  name: "convert-gif",
  entry: "./handler.ts",
});
