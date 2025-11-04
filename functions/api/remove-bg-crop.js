const HF_MODEL = "briaai/RMBG-1.4";
const ALPHA_THRESHOLD = 10;
const MARGIN_RATIO = 0.03;

const base64ToUint8Array = (base64) => {
  const normalized = base64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");
  const binary = atob(normalized);
  const length = binary.length;
  const bytes = new Uint8Array(length);

  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
};

const arrayBufferToBase64 = (arrayBuffer) => {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
};

const cropTransparentBounds = async (base64Image) => {
  const blob = new Blob([base64ToUint8Array(base64Image)], { type: "image/png" });
  const imageBitmap = await createImageBitmap(blob);

  const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
  const ctx = canvas.getContext("2d");
  ctx.drawImage(imageBitmap, 0, 0);

  const { data, width, height } = ctx.getImageData(
    0,
    0,
    imageBitmap.width,
    imageBitmap.height
  );

  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > ALPHA_THRESHOLD) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX >= maxX || minY >= maxY) {
    throw new Error("피사체를 찾지 못했습니다.");
  }

  const marginX = Math.round(width * MARGIN_RATIO);
  const marginY = Math.round(height * MARGIN_RATIO);

  minX = Math.max(0, minX - marginX);
  minY = Math.max(0, minY - marginY);
  maxX = Math.min(width, maxX + marginX);
  maxY = Math.min(height, maxY + marginY);

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const cropCanvas = new OffscreenCanvas(cropWidth, cropHeight);
  const cropCtx = cropCanvas.getContext("2d");

  cropCtx.drawImage(
    canvas,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight
  );

  const croppedBlob = await cropCanvas.convertToBlob({ type: "image/png" });
  const croppedBase64 = arrayBufferToBase64(await croppedBlob.arrayBuffer());

  return `data:image/png;base64,${croppedBase64}`;
};

export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    const apiKey = env.HF_TOKEN;
    if (!apiKey) {
      throw new Error("HF_TOKEN 환경 변수가 설정되지 않았습니다.");
    }

    const imageBytes = base64ToUint8Array(imageBase64);
    const formData = new FormData();
    formData.append("file", new Blob([imageBytes], { type: "image/png" }), "image.png");

    const response = await fetch(`https://api-inference.huggingface.co/models/${HF_MODEL}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(`Hugging Face 요청 실패: ${detail}`);
    }

    const resultBlob = await response.blob();
    const base64 = arrayBufferToBase64(await resultBlob.arrayBuffer());
    const dataUrl = `data:image/png;base64,${base64}`;

    const croppedDataUrl = await cropTransparentBounds(dataUrl);

    return new Response(JSON.stringify({ image: croppedDataUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg-crop 오류:", err);
    return new Response(
      JSON.stringify({
        error: "배경제거+크롭 실패",
        detail: err.message,
      }),
      { status: 500 }
    );
  }
};
