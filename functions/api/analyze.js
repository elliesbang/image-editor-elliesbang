export const onRequestPost = async ({ request, env }) => {
  try {
    const { images = [] } = await request.json();
    if (!images.length) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지 데이터가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ 다중 이미지 개별 분석
    const allKeywords = [];
    const imageKeywordsList = [];

    for (const [i, imgBase64] of images.entries()) {
      const clean = imgBase64.replace(/^data:image\/\w+;base64,/, "");
      const bytes = Uint8Array.from(atob(clean), (c) => c.charCodeAt(0));

      const result = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
        image: [...bytes],
        prompt:
          "이 이미지를 기반으로 미리캔버스 SEO에 적합한 키워드 25개를 쉼표로 구분해 생성해줘. " +
          "색상, 분위기, 사물, 감정, 스타일, 배경, 카테고리를 모두 고려해. " +
          "영문 키워드는 제외하고 한국어로 작성해.",
      });

      const text = result.output_text || "";
      const keywords = text
        .split(/[,\n]+/)
        .map((k) => k.trim())
        .filter((k) => k.length > 1);

      imageKeywordsList.push(keywords);
      allKeywords.push(...keywords);
    }

    // ✅ 공통 키워드 계산
    const common = imageKeywordsList.length > 1
      ? imageKeywordsList.reduce((a, b) => a.filter((k) => b.includes(k)))
      : imageKeywordsList[0] || [];

    // ✅ 최종 키워드 25개 (공통 + 전체 상위)
    const freq = {};
    allKeywords.forEach((k) => (freq[k] = (freq[k] || 0) + 1));
    const ranked = Object.entries(freq)
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);

    const finalKeywords = Array.from(new Set([...common, ...ranked])).slice(0, 25);

    // ✅ 제목 생성 (AI)
    const titlePrompt = `이 키워드들을 이용해 미리캔버스용 SEO 제목을 1줄로 만들어줘. 자연스럽고 감성적인 문장으로. 
    키워드: ${finalKeywords.join(", ")}`;

    const titleResult = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
      prompt: titlePrompt,
    });

    const title = titleResult.output_text?.trim() || "AI 생성 제목";

    return new Response(
      JSON.stringify({
        success: true,
        title,
        keywords: finalKeywords,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 키워드 분석 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "서버 오류 발생",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
