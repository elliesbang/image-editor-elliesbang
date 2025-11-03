export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { status: 400 }
      );
    }

    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey)
      throw new Error("OPENAI_API_KEY 환경 변수가 누락되었습니다.");

    // ✅ 1단계: OpenAI 배경제거 API 호출
    const bgRemovedRes = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: (() => {
        const formData = new FormData();
        const buffer = Buffer.from(imageBase64, "base64");
        const blob = new Blob([buffer], { type: "image/png" });

        formData.append("image", blob, "input.png");
        formData.append(
          "prompt",
          "Remove the background cleanly, preserving only the main subject in sharp detail."
        );
        formData.append("model", "gpt-image-1");
        formData.append("size", "1024x1024");
        return formData;
      })(),
    });

    const bgData = await bgRemovedRes.json();
    const removedBgBase64 = bgData.data?.[0]?.b64_json;
    if (!removedBgBase64)
      throw new Error("OpenAI에서 배경제거 이미지가 반환되지 않았습니다.");

    // ✅ 2단계: 피사체 중심 크롭 (서버 측 Canvas)
    const buffer = Buffer.from(removedBgBase64, "base64");
    const blob = new Blob([buffer], { type: "image/png" });
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

    let minX = width,
      minY = height,
      maxX = 0,
      maxY = 0;

    // ✅ 피사체 알파값이 있는 영역만 탐색
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha > 10) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }

    if (minX >= maxX || minY >= maxY)
      throw new Error("피사체를 찾지 못했습니다.");

    // ✅ 여백 3% 추가 (너무 꽉 차지 않게)
    const marginX = Math.round(width * 0.03);
    const marginY = Math.round(height * 0.03);
    minX = Math.max(0, minX - marginX);
    minY = Math.max(0, minY - marginY);
    maxX = Math.min(width, maxX + marginX);
    maxY = Math.min(height, maxY + marginY);

    const cropWidth = maxX - minX;
    const cropHeight = maxY - minY;

    // ✅ 크롭된 캔버스 생성
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

    // ✅ 결과 Base64 반환
    const croppedBlob = await cropCanvas.convertToBlob({ type: "image/png" });
    const arrayBuffer = await croppedBlob.arrayBuffer();
    const croppedBase64 = Buffer.from(arrayBuffer).toString("base64");

    return new Response(
      JSON.stringify({ image: `data:image/png;base64,${croppedBase64}` }),
      { headers: { "Content-Type": "application/json" } }
    );
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
