export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64, colorCount = 3, color = "#ffd331" } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지가 필요합니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;
    const formData = new FormData();
    const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    formData.append("image", new Blob([buffer]), "input.png");
    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      `
      이 이미지를 ${colorCount}가지 색상으로 단순화하고,
      대표 색상은 ${color} 계열로 유지하며 SVG 벡터로 변환하세요.
      SVG에는 반드시 viewBox 속성을 포함하고 모든 stroke 속성은 제거합니다.
      출력은 150KB 이하로 최적화하세요.
      `
    );

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
    });

    const data = await res.json();
    const result = data?.data?.[0]?.b64_json;
    if (!result) throw new Error("SVG 변환 실패");

    // 크기 제한 확인
    const sizeKB = (result.length * 3) / 4 / 1024;
    if (sizeKB > 150) throw new Error(`SVG 크기 초과 (${Math.round(sizeKB)}KB)`);

    return new Response(JSON.stringify({ result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("SVG Error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
