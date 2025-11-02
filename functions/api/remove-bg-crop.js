// ✅ 배경제거(Hugging Face) + 크롭(로컬) 통합 API
import { parseImageInput } from "../_utils/parseImageInput";

export const onRequestPost = async ({ request, env }) => {
  try {
    // 1️⃣ 이미지 파싱
    const imageBase64 = await parseImageInput(request);
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // 2️⃣ Hugging Face API로 배경제거
    const apiUrl = "https://api-inference.huggingface.co/models/briaai/RMBG-1.4";
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0)),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("⚠️ Hugging Face 오류:", errText);
      throw new Error("배경제거 실패 (HuggingFace)");
    }

    const blob = await response.blob();
    const arrayBuffer = await blob.arrayBuffer();

    // 3️⃣ Blob → ImageData로 변환하여 크롭 수행
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

    // 투명 픽셀 감지 → 크롭 영역 계산
    const { xMin, xMax, yMin, yMax } = getBoundingBox(imageData);
    const croppedWidth = xMax - xMin;
    const croppedHeight = yMax - yMin;

    // 4️⃣ 크롭된 이미지 새 캔버스에 그리기
    const croppedCanvas = new OffscreenCanvas(croppedWidth, croppedHeight);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(
      canvas,
      xMin,
      yMin,
      croppedWidth,
      croppedHeight,
      0,
      0,
      croppedWidth,
      croppedHeight
    );

    // 5️⃣ base64 변환
    const blobCropped = await croppedCanvas.convertToBlob({ type: "image/png" });
    const croppedArrayBuffer = await blobCropped.arrayBuffer();
    const base64Cropped = btoa(
      String.fromCharCode(...new Uint8Array(croppedArrayBuffer))
    );

    // ✅ 최종 결과 반환
    return new Response(
      JSON.stringify({
        success: true,
        result: base64Cropped,
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (err) {
    console.error("remove-bg-crop 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// ✅ 투명 픽셀 기준으로 크롭 영역 계산 함수
function getBoundingBox(imageData) {
  const { data, width, height } = imageData;
  let xMin = width, yMin = height, xMax = 0, yMax = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        found = true;
        if (x < xMin) xMin = x;
        if (x > xMax) xMax = x;
        if (y < yMin) yMin = y;
        if (y > yMax) yMax = y;
      }
    }
  }

  if (!found) return { xMin: 0, yMin: 0, xMax: width, yMax: height };
  return { xMin, yMin, xMax, yMax };
}