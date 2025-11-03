export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("file");

    if (!imageFile) {
      return new Response(
        JSON.stringify({ error: "이미지 파일이 없습니다." }),
        { status: 400 }
      );
    }

    const apiKey = env.HF_API_KEY;
    const model = "briaai/RMBG-1.4";

    // ✅ 1️⃣ Hugging Face로 배경제거
    const removeRes = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: imageFile,
      }
    );

    if (!removeRes.ok) {
      throw new Error(`배경제거 실패 (${removeRes.status})`);
    }

    // ✅ 결과 버퍼 생성
    const arrayBuffer = await removeRes.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: "image/png" });

    // ✅ 2️⃣ Web Canvas로 여백 제거 (투명 픽셀 기준)
    const imageBitmap = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0);

    // ✅ 이미지 데이터 읽기
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // ✅ 투명 영역 제외한 최소 bounding box 계산
    let minX = canvas.width,
      minY = canvas.height,
      maxX = 0,
      maxY = 0;
    for (let y = 0; y < canvas.height; y++) {
      for (let x = 0; x < canvas.width; x++) {
        const alpha = imgData[(y * canvas.width + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    // ✅ 여백 없는 딱 맞는 크기로 크롭
    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    const croppedCanvas = new OffscreenCanvas(cropW, cropH);
    const croppedCtx = croppedCanvas.getContext("2d");
    croppedCtx.drawImage(
      canvas,
      minX,
      minY,
      cropW,
      cropH,
      0,
      0,
      cropW,
      cropH
    );

    // ✅ 3️⃣ base64 변환
    const blobCropped = await croppedCanvas.convertToBlob({ type: "image/png" });
    const base64 = Buffer.from(await blobCropped.arrayBuffer()).toString("base64");

    return new Response(JSON.stringify({ result: base64 }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg-crop 오류:", err);
    return new Response(
      JSON.stringify({ error: "배경제거+크롭 실패", detail: err.message }),
      { status: 500 }
    );
  }
};
