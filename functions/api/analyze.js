// /functions/api/analyze.js
// 여러 장 이미지 지원 + 미리캔버스 SEO 최적 25키워드 + 공통/개별 키워드 계산
export const onRequestPost = async ({ request, env }) => {
  try {
    const apiKey = env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "OPENAI_API_KEY 누락" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let imageBase64List = [];

    // ✅ JSON / multipart 모두 지원
    const ctype = request.headers.get("content-type") || "";
    if (ctype.includes("application/json")) {
      const body = await request.json();
      if (Array.isArray(body.imageBase64List)) {
        imageBase64List = body.imageBase64List.filter(Boolean);
      } else if (body.imageBase64) {
        imageBase64List = [body.imageBase64];
      }
    } else if (ctype.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("images");
      for (const f of files) {
        if (f && typeof f.arrayBuffer === "function") {
          const buf = await f.arrayBuffer();
          const b64 = Buffer.from(buf).toString("base64");
          imageBase64List.push(b64);
        }
      }
    }

    if (!imageBase64List.length) {
      return new Response(JSON.stringify({ success: false, error: "분석할 이미지가 없습니다." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ✅ 1장씩 순차 분석(대용량 안전), 결과 축적
    const perImage = [];
    for (let i = 0; i < imageBase64List.length; i++) {
      const img64 = imageBase64List[i];

      // OpenAI Responses API 호출 (gpt-4o), JSON 스키마 강제
      const payload = {
        model: "gpt-4o",
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
                  "당신은 이미지 기반 SEO 키워드 큐레이터입니다. " +
                  "출력은 한국어로 하되, 키워드는 미리캔버스(디자인 마켓) 검색 최적화를 목표로 1~3단어 조합의 실사용 검색어 위주로 만들어주세요. " +
                  "색상/소재/질감/테마/오브젝트/용도/스타일을 균형있게 섞되, 지나치게 일반적인 단어(예: '템플릿', '디자인', '이미지')나 금칙어(브랜드명/연예인명/민감어)는 피하고, " +
                  "중복/변형중복을 제거해 유니크하게 25개를 구성하세요."
              }
            ],
          },
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  "아래 이미지를 보고: \n" +
                  "1) 25개의 SEO 키워드 배열(keywords) 생성 (각 항목 1~3단어, 쉼표·해시태그·따옴표 금지, 전부 서로 다른 의미) \n" +
                  "2) 위 키워드 중 핵심 2~3개로 간결한 제목(title) 생성 \n" +
                  "❗설명(description)은 만들지 마세요. 결과는 JSON만 반환하세요."
              },
              {
                type: "input_image",
                image_url: `data:image/png;base64,${img64}`,
              },
            ],
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "miri_canvas_seo_keywords",
            schema: {
              type: "object",
              additionalProperties: false,
              required: ["title", "keywords"],
              properties: {
                title: { type: "string", minLength: 1 },
                keywords: {
                  type: "array",
                  minItems: 25,
                  maxItems: 25,
                  items: { type: "string", minLength: 1 },
                },
              },
            },
          },
        },
        max_output_tokens: 800,
      };

      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errt = await res.text();
        throw new Error(`OpenAI 분석 실패 (${res.status}): ${errt}`);
      }

      const data = await res.json();

      // ✅ 안전 파싱 (Responses 포맷 호환)
      const rawText =
        data?.output?.[0]?.content?.[0]?.text ??
        data?.outputs?.[0]?.content?.[0]?.text ??
        data?.response?.output_text ??
        "";

      let parsed = null;
      try {
        parsed = JSON.parse(rawText);
      } catch (e) {
        // 스키마가 강제되므로 거의 오지 않지만, 대비
        parsed = { title: "분석 결과", keywords: [] };
      }

      // 정규화
      const normKeywords = (parsed.keywords || [])
        .map((k) => k.trim())
        .filter(Boolean);

      perImage.push({
        index: i,
        title: parsed.title?.trim() || "분석 결과",
        keywords: normKeywords,
      });
    }

    // ✅ 공통 / 개별 키워드 계산 (대소문자 무시)
    const toKey = (s) => s.toLowerCase();
    let common = [];
    if (perImage.length === 1) {
      common = perImage[0].keywords;
    } else {
      // 교집합
      const sets = perImage.map((p) => new Set(p.keywords.map(toKey)));
      const first = sets[0];
      common = [...first].filter((kw) => sets.every((s) => s.has(kw)));

      // 다시 원문 보존 형태로 매핑
      const anyOriginal = (kwLower) => {
        for (const p of perImage) {
          const hit = p.keywords.find((k) => toKey(k) === kwLower);
          if (hit) return hit;
        }
        return kwLower;
      };
      common = common.map(anyOriginal);
    }

    // 개별 유니크
    const perImageWithUnique = perImage.map((p) => {
      const others = perImage
        .filter((x) => x !== p)
        .flatMap((x) => x.keywords.map(toKey));
      const otherSet = new Set(others);
      const unique = p.keywords.filter((k) => !otherSet.has(toKey(k)));
      return { ...p, uniqueKeywords: unique };
    });

    // ✅ 대표 제목 (공통 키워드 기준 2~3개 조합)
    const repTitle =
      (common[0] && common[1] && `${common[0]} · ${common[1]}`) ||
      perImageWithUnique[0]?.title ||
      "이미지 키워드 분석";

    return new Response(
      JSON.stringify({
        success: true,
        title: repTitle,
        commonKeywords: common,
        perImage: perImageWithUnique, // [{index, title, keywords[25], uniqueKeywords[]}]
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
