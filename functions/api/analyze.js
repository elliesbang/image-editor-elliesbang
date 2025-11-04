// /functions/api/analyze.js

export const onRequestPost = async ({ request, env }) => {
  try {
    const contentType = request.headers.get("content-type") || "";
    let imageBase64 = "";

    // JSON 요청 처리
    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body.imageBase64 || "";
    }
    // FormData 요청 처리
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (file) {
        const buffer = await file.arrayBuffer();
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        imageBase64 = `data:image/png;base64,${btoa(binary)}`;
      }
    }

    // 유효성 검사
    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // OPENAI_API_KEY 확인
    const OPENAI_API_KEY = env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY 환경 변수가 설정되지 않았습니다." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Base64 정리 (data:image/...;base64, 접두사 확인)
    let cleanBase64 = imageBase64;
    if (!imageBase64.startsWith("data:image")) {
      cleanBase64 = `data:image/png;base64,${imageBase64}`;
    }

    // ✅ 올바른 OpenAI Vision API 호출
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", // 또는 gpt-4o-mini (더 저렴)
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: 
                  "이 이미지를 분석해서 키워드와 제목을 생성해줘.\n\n" +
                  "요구사항:\n" +
                  "1. 이미지와 연관된 핵심 키워드 25개 이하를 한국어로 추출\n" +
                  "2. 키워드들을 조합한 자연스럽고 짧은 제목 (5~10자)\n" +
                  "3. 반드시 JSON 형식으로만 응답\n\n" +
                  "응답 형식:\n" +
                  "{\n" +
                  '  "title": "제목",\n' +
                  '  "keywords": ["키워드1", "키워드2", ...]\n' +
                  "}"
              },
              {
                type: "image_url",
                image_url: {
                  url: cleanBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000, // Vision API는 필수!
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error("🚨 OpenAI API 오류:", errorData);
      
      return new Response(
        JSON.stringify({ 
          error: "OpenAI API 호출 실패",
          status: response.status,
          detail: errorData 
        }),
        { 
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const data = await response.json();
    
    // 응답에서 텍스트 추출
    let resultText = "";
    if (data.choices && data.choices[0]?.message?.content) {
      resultText = data.choices[0].message.content.trim();
    } else {
      console.error("예상치 못한 응답 구조:", data);
      return new Response(
        JSON.stringify({ 
          error: "응답 형식 오류",
          detail: "OpenAI 응답을 파싱할 수 없습니다." 
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // JSON 파싱 (```json ... ``` 형식도 처리)
    let result;
    try {
      // Markdown 코드 블록 제거
      const jsonMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/) || 
                        resultText.match(/```\s*([\s\S]*?)\s*```/);
      const jsonText = jsonMatch ? jsonMatch[1] : resultText;
      
      result = JSON.parse(jsonText);
      
      // 기본값 설정
      if (!result.title || !result.keywords) {
        throw new Error("Invalid JSON structure");
      }
    } catch (parseError) {
      console.warn("⚠️ JSON 파싱 실패, 텍스트 분석:", resultText);
      
      // 폴백: 텍스트에서 키워드 추출 시도
      const lines = resultText.split('\n').filter(l => l.trim());
      result = {
        title: lines[0]?.replace(/^(제목|title)[:：]\s*/i, '').trim() || "키워드 분석",
        keywords: resultText
          .split(/[,\n]+/)
          .map(k => k.trim())
          .filter(k => k && k.length > 1 && k.length < 20)
          .slice(0, 25)
      };
    }

    // 결과 반환
    return new Response(
      JSON.stringify({
        title: result.title,
        keywords: Array.isArray(result.keywords) ? result.keywords : []
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );

  } catch (err) {
    console.error("🚨 analyze 오류:", err);
    return new Response(
      JSON.stringify({ 
        error: "서버 처리 중 오류 발생",
        detail: err.message 
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};