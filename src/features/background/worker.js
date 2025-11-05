import { API_ENDPOINTS, MODELS } from "../shared/config";
import {
  dispatchResult,
  ensureDataUrl,
  runWorkerAI,
  toBase64,
} from "../shared/utils";

export async function runRemoveBg(image) {
  const imgSrc = await toBase64(image);
  if (!imgSrc) throw new Error("이미지 변환 실패");

  const result = await runWorkerAI(
    MODELS.REMOVE_BG,
    { image: imgSrc },
    async () => {
      const response = await fetch(API_ENDPOINTS.REMOVE_BG, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgSrc }),
      });

      if (!response.ok) {
        throw new Error("배경제거 API 호출 실패");
      }

      const data = await response.json();
      if (!data?.image && !data?.output_image) {
        throw new Error("배경제거 결과가 없습니다.");
      }

      return { image: data.image || data.output_image };
    }
  );

  const resultUrl = ensureDataUrl(result.image || result.output_image);
  return resultUrl;
}

export function dispatchBackgroundResult(url) {
  dispatchResult(url, "배경제거");
}
