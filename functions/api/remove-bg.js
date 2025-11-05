// /functions/api/remove-bg.js
// ByteDance RMBG (로컬 추론형) 버전
// Hugging Face API 없이 작동 — 외부 요청 없음

import * as ort from "onnxruntime-web";

export const onRequestPost = async ({ request }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // ✅ Base64 → Blob 변환
    const cleanBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");
    const binary = atob(cleanBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: "image/png" });
    const imageBitmap = await createImageBitmap(blob);

    // ✅ 이미지 → Tensor 변환
    const tensor = await imageToTensor(imageBitmap);

    // ✅ RMBG 모델 로드 (CDN에서 호스팅된 onnx 파일)
    // 👉 elliesbang GitHub에 models/rmbg-1.4.onnx 올려두면 됨
    const session = await ort.InferenceSession.create(
      "https://cdn.jsdelivr.net/gh/elliesbang/models/rmbg-1.4.onnx",
      { executionProviders: ["wasm"] }
    );

    // ✅ 추론 실행
    const mask = await runRMBG(session, tensor, imageBitmap.width, imageBitmap.height);

    // ✅ 마스크 적용해 투명 PNG 생성
    const resultBlob = await applyMaskToImage(imageBitmap, mask);

    // ✅ Blob → Base64 변환
    const arrayBuffer = await resultBlob.arrayBuffer();
    const resultBase64 = btoa(
      String.fromCharCode(...new Uint8Array(arrayBuffer))
    );

    return new Response(
      JSON.stringify({
        image: `data:image/png;base64,${resultBase64}`,
        model: "ByteDance RMBG-1.4 (local)",
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(
      JSON.stringify({
        error: "배경 제거 실패",
        detail: err.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};

/* ---------------------- 유틸 함수 ---------------------- */

// 이미지 → Tensor 변환
async function imageToTensor(image) {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);
  const floatData = new Float32Array(image.width * image.height * 3);

  for (let i = 0; i < image.width * image.height; i++) {
    floatData[i * 3] = imageData.data[i * 4] / 255;
    floatData[i * 3 + 1] = imageData.data[i * 4 + 1] / 255;
    floatData[i * 3 + 2] = imageData.data[i * 4 + 2] / 255;
  }

  return new ort.Tensor("float32", floatData, [1, 3, image.height, image.width]);
}

// RMBG 추론 실행
async function runRMBG(session, tensor, width, height) {
  const feeds = { input: tensor };
  const results = await session.run(feeds);
  return results.output.data;
}

// 마스크 → 투명 PNG 생성
async function applyMaskToImage(image, mask) {
  const canvas = new OffscreenCanvas(image.width, image.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, image.width, image.height);

  for (let i = 0; i < image.width * image.height; i++) {
    const alpha = Math.min(Math.max(mask[i] * 255, 0), 255);
    imageData.data[i * 4 + 3] = alpha;
  }

  ctx.putImageData(imageData, 0, 0);
  return await canvas.convertToBlob({ type: "image/png" });
}