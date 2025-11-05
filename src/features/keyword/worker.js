import { API_ENDPOINTS, MODELS } from "../shared/config";
import { toBase64 } from "../shared/utils";

const KEYWORD_PROMPT =
  "이 이미지를 기반으로 미리캔버스 SEO에 적합한 키워드 25개를 쉼표로 구분해 생성해줘. " +
  "색상, 분위기, 사물, 감정, 스타일, 배경, 카테고리를 모두 고려해. " +
  "영문 키워드는 제외하고 한국어로 작성해.";

const TITLE_PROMPT = (keywords) =>
  `이 키워드들을 이용해 미리캔버스용 SEO 제목을 1줄로 만들어줘. 자연스럽고 감성적인 문장으로. 키워드: ${keywords.join(", ")}`;

const parseKeywords = (text = "") =>
  text
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter((item) => item.length > 1);

export async function runKeywordAnalysis(images = []) {
  const base64List = (
    await Promise.all(images.map((image) => toBase64(image)))
  ).filter(Boolean);

  if (!base64List.length) {
    throw new Error("키워드 분석을 위한 이미지가 없습니다.");
  }

  if (typeof globalThis !== "undefined" && globalThis.AI?.run) {
    const allKeywords = [];
    const imageKeywordsList = [];

    for (const base64 of base64List) {
      const response = await globalThis.AI.run(MODELS.KEYWORD, {
        image: base64,
        prompt: KEYWORD_PROMPT,
      });

      const text = response?.output_text || "";
      const keywords = parseKeywords(text);
      if (keywords.length > 0) {
        imageKeywordsList.push(keywords);
        allKeywords.push(...keywords);
      }
    }

    if (!allKeywords.length) {
      throw new Error("AI 분석 결과가 비어 있습니다.");
    }

    const common =
      imageKeywordsList.length > 1
        ? imageKeywordsList.reduce((prev, current) =>
            prev.filter((keyword) => current.includes(keyword))
          )
        : imageKeywordsList[0] || [];

    const frequency = {};
    allKeywords.forEach((keyword) => {
      frequency[keyword] = (frequency[keyword] || 0) + 1;
    });

    const ranked = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .map(([keyword]) => keyword);

    const finalKeywords = Array.from(new Set([...common, ...ranked])).slice(
      0,
      25
    );

    const titleResult = await globalThis.AI.run(MODELS.KEYWORD, {
      prompt: TITLE_PROMPT(finalKeywords),
    });

    const title = titleResult?.output_text?.trim() || "AI 생성 제목";

    return { title, keywords: finalKeywords };
  }

  const response = await fetch(API_ENDPOINTS.KEYWORD, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ images: base64List }),
  });

  if (!response.ok) {
    throw new Error("키워드 분석 API 호출 실패");
  }

  const data = await response.json();
  if (!data?.success) {
    throw new Error(data?.error || "키워드 분석 실패");
  }

  return { title: data.title, keywords: data.keywords };
}
