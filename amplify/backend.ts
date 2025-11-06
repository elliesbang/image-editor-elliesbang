import { defineBackend, HttpApi } from "@aws-amplify/backend";
import { removeBgFunction } from "./functions/remove-bg/resource";
import { cropFunction } from "./functions/crop/resource";
import { denoiseFunction } from "./functions/denoise/resource";
import { removeBgCropFunction } from "./functions/remove-bg-crop/resource";
import { keywordAnalyzeFunction } from "./functions/keyword-analyze/resource";
import { convertSvgFunction } from "./functions/convert-svg/resource";
import { convertGifFunction } from "./functions/convert-gif/resource";

export const backend = defineBackend(() => {
  const api = new HttpApi("image-editor-api", {
    routes: [
      {
        path: "/api/remove-bg",
        method: "POST",
        function: removeBgFunction,
      },
      {
        path: "/api/crop",
        method: "POST",
        function: cropFunction,
      },
      {
        path: "/api/denoise",
        method: "POST",
        function: denoiseFunction,
      },
      {
        path: "/api/remove-bg-crop",
        method: "POST",
        function: removeBgCropFunction,
      },
      {
        path: "/api/keyword-analyze",
        method: "POST",
        function: keywordAnalyzeFunction,
      },
      {
        path: "/api/convert-svg",
        method: "POST",
        function: convertSvgFunction,
      },
      {
        path: "/api/convert-gif",
        method: "POST",
        function: convertGifFunction,
      },
    ],
  });

  return {
    api,
  };
});
