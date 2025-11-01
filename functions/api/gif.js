export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "처리 결과 이미지를 선택해주세요." }),
        { status: 400 }
      );
    }

    const apiKey = env.OPENAI_API_KEY;

    // ✅ AI에게 '움직임이 느껴지는 한 장짜리 GIF 스타일'로 변환 요청
    const formData = new FormData();
    const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    formData.append("image", new Blob([buffer]), "result.png");
    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      `
      이 이미지를 자연스럽게 움직임이 느껴지는 GIF 스타일로 변환하세요.
      빛 번짐, 잔상, 부드러운 흔들림 효과를 살짝 더해 실제로 움직이는 듯한 한 장짜리 GIF 이미지를 만듭니다.
      배경은 유지하되, 피사체에 생동감을 줍니다.
      `
    );

    // ✅ OpenAI 이미지 편집 API 호출
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;

    if (!result) {
      console.error("GIF 변환 실패:", data);
      return new Response(
        JSON.stringify({ error: "GIF 변환 중 오류가 발생했습니다." }),
        { status: 500 }
      );
    }

    // ✅ 용량 제한 확인
    const byteSize = (result.length * 3) / 4;
    if (byteSize > 150 * 1024) {
      return new Response(
        JSON.stringify({
          error: "GIF 결과 이미지가 150KB를 초과했습니다. 더 작은 이미지로 시도해주세요.",
        }),
        { status: 400 }
      );
    }

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("GIF 변환 오류:", e);
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};
