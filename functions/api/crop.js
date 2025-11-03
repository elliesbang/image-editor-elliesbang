export const onRequestPost = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "이미지 파일이 없습니다." }), { status: 400 });
    }

    // ✅ Blob → ImageBitmap
    const imageBitmap = await createImageBitmap(imageFile);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    const { width, height } = canvas;
    const imgData = ctx.getImageData(0, 0, width, height).data;

    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;

    // ✅ 1차 탐색 (기존)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = imgData[(y * width + x) * 4 + 3];
        if (alpha > 2) { // 알파 완화
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // ✅ 2차 보정: 외곽선 주변 살짝 확장 (blur 효과 대신 margin 확장)
    const expand = Math.floor(Math.max(width, height) * 0.03); // 🔹3% 확장
    minX = Math.max(0, minX - expand);
    minY = Math.max(0, minY - expand);
    maxX = Math.min(width, maxX + expand);
    maxY = Math.min(height, maxY + expand);

    // ✅ 크롭
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const croppedCanvas = new OffscreenCanvas(cropW, cropH);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    // ✅ Base64 변환
    const blob = await croppedCanvas.convertToBlob({ type: "image/png" });
    const base64 = Buffer.from(await blob.arrayBuffer()).toString("base64");

    return new Response(JSON.stringify({ result: base64 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 crop 오류:", err);
    return new Response(JSON.stringify({ error: "크롭 실패", detail: err.message }), {
      status: 500,
    });
  }
};
