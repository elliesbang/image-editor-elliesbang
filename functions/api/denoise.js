export const onRequestPost = async ({ request, env }) => {
  try {
    // ✅ 프론트에서 보낸 FormData 받기
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file) {
      return new Response(
        JSON.stringify({ error: "이미지 파일이 없습니다." }),
        { status: 400 }
      );
    }

    const apiKey = env.OPENAI_API_KEY;

    // ✅ OpenAI API에 전송할 FormData 생성
    const forward = new FormData();
    forward.append("model", "gpt-image-1");
    forward.append("image", file);
    forward.append("prompt", "이미지의 노이즈를 제거하고 선명하게 만드세요.");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: forward,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json || null;

    if (!result) {
      throw new Error("OpenAI 응답에 노이즈 제거 결과가 없습니다.");
    }

    // ✅ 성공 응답
    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("denoise 오류:", e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500 }
    );
  }
};
