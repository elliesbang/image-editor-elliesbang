export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ 1. 프론트에서 보낸 FormData 받기
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return new Response(
        JSON.stringify({ error: "이미지를 선택해주세요." }),
        { status: 400 }
      );
    }

    const apiKey = env.OPENAI_API_KEY;

    // ✅ 2. OpenAI API 전송용 FormData 구성
    const forward = new FormData();
    forward.append("model", "gpt-image-1");
    forward.append("image", file);
    forward.append(
      "prompt",
      `
      주어진 이미지를 바탕으로,
      실제 움직이지는 않지만 빛의 잔상, 흔들림, 반짝임, 잔광 효과가 있는
      예술적 GIF 느낌의 이미지를 생성하세요.
      `
    );

    // ✅ 3. OpenAI API 호출
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: forward,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;

    if (!result) throw new Error("OpenAI 응답에 결과 이미지가 없습니다.");

    // ✅ 4. 브라우저로 반환
    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GIF 변환 오류:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500 }
    );
  }
};
