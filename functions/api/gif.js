export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ 프론트엔드에서 보낸 FormData 수신
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return new Response(
        JSON.stringify({ error: "이미지를 선택해주세요." }),
        { status: 400 }
      );
    }

    const apiKey = env.OPENAI_API_KEY;

    // ✅ OpenAI API에 보낼 FormData 새로 구성
    const forward = new FormData();
    forward.append("model", "gpt-image-1");
    forward.append("image", file);
    forward.append(
      "prompt",
      `
      주어진 이미지를 기반으로,
      실제 움직이지는 않지만 빛의 잔상, 흔들림, 반짝임, 잔광 효과가 있는
      예술적인 GIF 느낌의 이미지를 생성하세요.
      `
    );

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: forward,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;

    if (!result) throw new Error("GIF 변환 실패: OpenAI 응답이 비어 있습니다.");

    // ✅ 성공 응답 반환
    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("GIF 변환 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
