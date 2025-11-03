// force redeploy unique signature 2025-11-03T13:12Z
export const onRequestPost = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");
    if (!imageFile) {
      return new Response(JSON.stringify({ error: "이미지 파일이 없습니다." }), {
        status: 400,
      });
    }

    // ✅ Blob → ImageBitmap 변환
    const blob = imageFile;
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    // ✅ 이미지 데이터 분석
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;

    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = imgData[(y * canvas.width + x) * 4 + 3];
        if (alpha > 2) { // 투명 아님
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // ✅ 피사체 보존 + 여백 최소 유지 (2%)
    const expand = Math.floor((maxX - minX) * 0.02);
    minX = Math.max(0, minX - expand);
    minY = Math.max(0, minY - expand);
    maxX = Math.min(canvas.width, maxX + expand);
    maxY = Math.min(canvas.height, maxY + expand);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;

    // ✅ 크롭된 캔버스
    const croppedCanvas = new OffscreenCanvas(cropW, cropH);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    // ✅ Base64 변환
    const croppedBlob = await croppedCanvas.convertToBlob({ type: "image/png" });
    const base64 = Buffer.from(await croppedBlob.arrayBuffer()).toString("base64");

    return new Response(JSON.stringify({ result: base64 }), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store", // 캐시 차단
      },
    });
  } catch (err) {
    console.error("🚨 crop-v3 오류:", err);
    return new Response(
      JSON.stringify({ error: "크롭 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
