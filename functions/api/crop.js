import sharp from "sharp";

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

    // ✅ 파일을 Buffer로 변환
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    let image = sharp(buffer);

    // ✅ 메타데이터 확인
    const meta = await image.metadata();

    // ✅ 투명 또는 흰색 여백 자동 제거
    try {
      // 투명 여백 제거 (투명도 있는 이미지)
      image = image.trim({ threshold: 10 });
    } catch {
      // 흰 배경 이미지의 경우 흰색 여백 제거
      image = image
        .flatten({ background: "#ffffff" })
        .trim({ threshold: 240 });
    }

    // ✅ 결과 버퍼 생성
    const outputBuffer = await image.toBuffer();

    // ✅ base64 인코딩 변환
    const base64 = outputBuffer.toString("base64");

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
