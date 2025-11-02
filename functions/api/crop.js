// ✅ 로컬에서 이미지 자동 크롭 처리 (투명 영역 기준)
import { parseImageInput } from "../_utils/parseImageInput";

export const onRequestPost = async ({ request }) => {
  try {
    // 1️⃣ 이미지 데이터 가져오기
    const imageBase64 = await parseImageInput(request);
    if (!imageBase64) {
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), {
        status: 400,
      });
    }

    // 2️⃣ base64 → Blob → ImageBitmap
    const blob = new Blob(
      [Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0))],
      { type: "image/png" }
    );
    const imageBitmap = await createImageBitmap(blob);

    // 3️⃣ 캔버스 생성 후 이미지 그리기
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    // 4️⃣ 이미지 데이터 픽셀 단위 분석 (투명 픽셀 제거)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const { xMin, yMin, xMax, yMax } = getBoundingBox(imageData);

    // 5️⃣ 크롭 영역 계산
    const croppedWidth = xMax - xMin;
    const croppedHeight = yMax - yMin;
    if (croppedWidth <= 0 || croppedHeight <= 0) {
      throw new Error("유효한 이미지 영역을 찾을 수 없습니다.");
    }

    // 6️⃣ 새 캔버스에 크롭된 영역만 다시 그리기
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

    // 7️⃣ Blob → base64 변환
    const croppedBlob = await croppedCanvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const base64Cropped = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    // ✅ 8️⃣ 결과 반환
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
    console.error("crop 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};

// ✅ 투명 픽셀 기준 크롭 영역 계산 함수
function getBoundingBox(imageData) {
  const { data, width, height } = imageData;
  let xMin = width, yMin = height, xMax = 0, yMax = 0;
  let found = false;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) { // 투명도 10 이상이면 유효 픽셀
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