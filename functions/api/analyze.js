export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64) throw new Error("이미지 데이터가 없습니다.");

    const apiKey = env.OPENAI_API_KEY;

    // ✅ GPT-4o Vision API 호출
    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: `
당신은 미리캔버스(Miricanvas) 템플릿 및 디자인 요소 등록용 SEO 전문가입니다.
이미지를 분석하여 **미리캔버스 승인 및 검색 노출에 최적화된 결과**를 만들어주세요.

📌 지침:
1️⃣ 한국어로 작성할 것  
2️⃣ 아래 세 가지를 JSON 형식으로 출력할 것  

- title: 미리캔버스 SEO에 적합한 짧은 제목 (핵심 키워드 2~3개 조합)
- keywords: 미리캔버스 검색에 잘 노출되는 키워드 25개 (2~3단어 형태, 쉼표 구분)
- description: 이미지 분위기 및 활용처를 설명하는 짧은 문장 (포스터, 카드뉴스 등 활용 가능성 포함)

출력 예시 👇
{
  "title": "봄 감성 수채화 배경 일러스트",
  "keywords": [
    "봄 배경", "수채화 일러스트", "벚꽃 디자인", "감성 배경",
    "핑크 파스텔톤", "플로럴 패턴", "자연 일러스트", ...
  ],
  "description": "감성적인 봄날의 수채화 배경으로 포스터나 카드뉴스에 잘 어울립니다."
}
                `,
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${imageBase64}`,
              },
            ],
          },
        ],
        max_output_tokens: 1000,
      }),
    });

    const data = await res.json();

    // ✅ GPT 응답 텍스트 안전하게 추출
    let rawText =
      data?.output?.[0]?.content?.[0]?.text ||
      data?.outputs?.[0]?.content?.[0]?.text ||
      "";

    console.log("🧠 GPT-4o 원본 응답:", rawText);

    // ✅ 코드블록(````json`) 제거
    rawText = rawText.replace(/```json|```/g, "").trim();

    // ✅ JSON 파싱
    let result = {};
    try {
      result = JSON.parse(rawText);
    } catch {
      console.warn("⚠️ JSON 파싱 실패, 수동 처리 시도");
      const matchKeywords = rawText.match(/"keywords"\s*:\s*$begin:math:display$([^$end:math:display$]+)\]/);
      const matchTitle = rawText.match(/"title"\s*:\s*"([^"]+)"/);
      const matchDesc = rawText.match(/"description"\s*:\s*"([^"]+)"/);

      result = {
        title: matchTitle ? matchTitle[1] : "디자인 요소",
        keywords: matchKeywords
          ? matchKeywords[1]
              .split(",")
              .map((k) => k.replace(/"|'/g, "").trim())
              .filter((k) => k.length > 1)
              .slice(0, 25)
          : [],
        description: matchDesc
          ? matchDesc[1]
          : "미리캔버스용 디자인 요소입니다.",
      };
    }

    // ✅ 데이터 정리
    const cleanKeywords = Array.from(new Set(result.keywords)).slice(0, 25);
    const cleanTitle = result.title?.replace(/[^가-힣a-zA-Z0-9·\s]/g, "").trim();
    const cleanDesc = result.description?.trim();

    // ✅ 최종 응답
    return new Response(
      JSON.stringify({
        success: true,
        title: cleanTitle,
        keywords: cleanKeywords,
        description: cleanDesc,
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
