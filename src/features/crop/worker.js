import { API_ENDPOINTS, MODELS } from "../shared/config";
import {
  cropTransparentImage,
  ensureDataUrl,
  runWorkerAI,
  toBase64,
} from "../shared/utils";

export async function runAutoCrop(image) {
  const imgSrc = await toBase64(image);
  if (!imgSrc) throw new Error("이미지 변환 실패");

  const result = await runWorkerAI(
    MODELS.SEGMENT,
    { image: imgSrc },
    async () => {
      const response = await fetch(API_ENDPOINTS.CROP, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: imgSrc }),
      });

      if (!response.ok) {
        throw new Error("크롭 API 호출 실패");
      }

      const data = await response.json();
      if (!data?.image && !data?.output_image) {
        throw new Error("크롭 결과가 없습니다.");
      }

      return { image: data.image || data.output_image };
    }
  );

  const segmented = ensureDataUrl(result.image || result.output_image);
  return await cropTransparentImage(segmented);
}
