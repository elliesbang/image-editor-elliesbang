import { readImagePayload, handleError } from "./_utils.js";

export async function onRequestPost(context) {
  try {
    // ✅ 1. 요청에서 이미지 읽기
    const { buffer } = await readImagePayload(context.request);

    // ✅ 2. OpenAI API 호출
    const apiKey = context.env.OPENAI_API_KEY;
    const base64 = buffer.toString("base64");

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o", // ✅ 최신 비전 모델
        messages: [
          {
            role: "system",
            content:
              "You are an AI that analyzes an image and returns concise English keywords describing it. Respond with only 10 comma-separated keywords. No sentences.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image and return 10 keywords." },
              {
                type: "image_url",
                image_url: `data:image/png;base64,${base64}`,
              },
            ],
          },
        ],
      }),
    });

    // ✅ 3. 결과 처리
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const keywords = data.choices?.[0]?.message?.content?.trim() || "No keywords found.";

    // ✅ 4. JSON 반환
    return Response.json({ keywords });
  } catch (error) {
    return handleError(error);
  }
}
