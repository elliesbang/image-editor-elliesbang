export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    const width = parseInt(formData.get("width"));

    if (!imageFile || !width) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "이미지 또는 width 값이 없습니다.",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ OpenAI API 호출 준비
    const apiKey = env.OPENAI_API_KEY;
    const openaiForm = new FormData();
    openaiForm.append("image", imageFile, "input.png");
    openaiForm.append("model", "gpt-image-1");
    openaiForm.append("size", `${width}x${width}`); // 정사각 기준으로 리사이즈

    // ✅ OpenAI 이미지 편집 API 호출
    const response = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: openaiForm,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI 리사이즈 실패 (${response.status}): ${errText}`);
    }

    const result = await response.json();

    // ✅ 결과 파싱
    const base64 = result.data?.[0]?.b64_json;
    if (!base64) throw new Error("리사이즈 결과가 없습니다.");

    // ✅ 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        result: base64,
        message: "OpenAI 리사이즈 완료",
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 리사이즈 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: "리사이즈 처리 중 오류 발생: " + err.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
