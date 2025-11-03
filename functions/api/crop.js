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

    // ✅ Blob → ImageBitmap 변환
    const blob = imageFile;
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    // ✅ 이미지 데이터 픽셀 분석
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;

    // ✅ alpha 기준 완화 (기존 10 → 20)
    // 일부 반투명 경계도 피사체로 인식되게 함
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = imgData[(y * canvas.width + x) * 4 + 3];
        if (alpha > 20) { // 투명하지 않은 픽셀 감지
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // ✅ 최소 여백(5%) 남기기 → 피사체 절대 잘리지 않게
    const paddingRatio = 0.05;
    const paddingX = Math.floor((maxX - minX) * paddingRatio);
    const paddingY = Math.floor((maxY - minY) * paddingRatio);
    minX = Math.max(0, minX - paddingX);
    minY = Math.max(0, minY - paddingY);
    maxX = Math.min(canvas.width, maxX + paddingX);
    maxY = Math.min(canvas.height, maxY + paddingY);

    // ✅ 크롭된 캔버스 생성
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const croppedCanvas = new OffscreenCanvas(cropW, cropH);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

    // ✅ Base64로 반환
    const croppedBlob = await croppedCanvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");

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
