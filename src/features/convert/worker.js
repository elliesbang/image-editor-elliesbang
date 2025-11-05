import { API_ENDPOINTS, MODELS } from "../shared/config";
import { runWorkerAI, stripDataUrlPrefix, toBase64 } from "../shared/utils";

export async function runSvgConvert(image, { maxColors = 6 } = {}) {
  const imgSrc = await toBase64(image);
  if (!imgSrc) throw new Error("이미지 변환 실패");

  const result = await runWorkerAI(
    MODELS.SVG,
    {
      image: imgSrc,
      prompt: `convert to svg vector illustration with up to ${maxColors} colors, clean transparent background, include viewBox, remove stroke attributes, file size under 150KB`,
    },
    async () => {
      const response = await fetch(API_ENDPOINTS.SVG, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgSrc, colorLimit: maxColors }),
      });

      if (!response.ok) {
        throw new Error("SVG 변환 API 호출 실패");
      }

      const data = await response.json();
      if (!data?.svg && !data?.output_svg) {
        throw new Error("SVG 변환 결과가 없습니다.");
      }

      return { svg: data.svg || data.output_svg };
    }
  );

  const svg = result.svg || result.output_svg;
  if (!svg) throw new Error("SVG 변환 결과가 없습니다.");

  const blob = new Blob([svg], { type: "image/svg+xml" });
  return { svg, blob };
}

export async function runGifConvert(image, { loop = true } = {}) {
  const imgSrc = await toBase64(image);
  if (!imgSrc) throw new Error("이미지 변환 실패");

  const loopValue = loop ? 0 : 1;

  const result = await runWorkerAI(
    MODELS.GIF,
    {
      image: imgSrc,
      resize: { width: 700, height: null },
      dpi: 72,
      loop: loopValue,
    },
    async () => {
      const response = await fetch(API_ENDPOINTS.GIF, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgSrc, loop }),
      });

      if (!response.ok) {
        throw new Error("GIF 변환 API 호출 실패");
      }

      const data = await response.json();
      if (!data?.gif && !data?.output_gif) {
        throw new Error("GIF 변환 결과가 없습니다.");
      }

      return { gif: data.gif || data.output_gif };
    }
  );

  const gifValue = result.gif || result.output_gif;
  if (!gifValue) throw new Error("GIF 변환 결과가 없습니다.");

  if (gifValue.startsWith("data:image")) {
    return gifValue;
  }

  const base64 = stripDataUrlPrefix(gifValue);
  return `data:image/gif;base64,${base64}`;
}
