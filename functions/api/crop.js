export const onRequestPost = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "이미지 파일이 없습니다." }),
        { status: 400 }
      );
    }

    // ✅ Blob → ImageBitmap
    const imageBitmap = await createImageBitmap(imageFile);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;

    // ✅ 투명도 감지 완화 (피사체 외곽 픽셀 최대한 포함)
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = imgData[(y * canvas.width + x) * 4 + 3];
        if (alpha > 1) { // 🔹기존 3 → 1로 완화: 거의 투명한 픽셀도 포함
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // ✅ padding 늘려서 잘림 방지 (사방 2.5% 여백)
    const paddingX = Math.floor((maxX - minX) * 0.025);
    const paddingY = Math.floor((maxY - minY) * 0.025);
    minX = Math.max(0, minX - paddingX);
    minY = Math.max(0, minY - paddingY);
    maxX = Math.min(canvas.width, maxX + paddingX);
    maxY = Math.min(canvas.height, maxY + paddingY);

    // ✅ 크롭
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const croppedCanvas = new OffscreenCanvas(cropW, cropH);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    // ✅ Base64 반환
    const croppedBlob = await croppedCanvas.convertToBlob({ type: "image/png" });
    const base64 = Buffer.from(await croppedBlob.arrayBuffer()).toString("base64");

    return new Response(JSON.stringify({ result: base64 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 crop 오류:", err);
    return new Response(
      JSON.stringify({ error: "크롭 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
