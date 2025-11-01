export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지가 필요합니다." }), { status: 400 });

    const apiKey = env.OPENAI_API_KEY;

    const buffer = Uint8Array.from(atob(imageBase64), (c) => c.charCodeAt(0));
    const formData = new FormData();
    formData.append("image", new Blob([buffer]), "input.png");
    formData.append("model", "gpt-image-1");
    formData.append(
      "prompt",
      `
      이미지를 원본 색상을 최대한 유지하면서 SVG 벡터로 변환하세요.
      단, 다음 조건을 모두 지키세요:
      - 반드시 viewBox 속성을 포함합니다.
      - stroke 속성은 모두 제거합니다.
      - fill 속성은 각 영역별 색상으로 설정합니다.
      - 단순화는 하지 않고, 편집이 용이하도록 경로(path) 분리합니다.
      - SVG 코드 내에서 색상(hex 코드)은 직접 지정되어야 합니다.
      - SVG 파일 크기는 150KB 이하로 최적화합니다.
      출력은 순수 SVG 코드로 반환하세요.
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

    // ⚙️ SVG 디코딩 후 문자열로 반환 (편집 가능)
    const svgString = atob(result);

    // ⚠️ 용량 제한
    const sizeKB = new Blob([svgString]).size / 1024;
    if (sizeKB > 150) throw new Error(`SVG 크기 초과 (${Math.round(sizeKB)}KB)`);

    return new Response(JSON.stringify({ svg: svgString }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("SVG 변환 오류:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
};
