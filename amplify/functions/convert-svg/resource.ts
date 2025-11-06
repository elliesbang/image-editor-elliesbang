import { defineFunction } from "@aws-amplify/backend";

export const convertSvgFunction = defineFunction({
  name: "convert-svg",
  entry: "./handler.ts",
});
