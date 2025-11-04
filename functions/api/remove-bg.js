// /functions/api/remove-bg.js

export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "이미지 데이터가 없습니다." }),
        { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    const HF_TOKEN = env.HF_TOKEN;
    if (!HF_TOKEN) {
      return new Response(
        JSON.stringify({ error: "HF_TOKEN 환경 변수가 설정되지 않았습니다." }),
        { 
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // Base64 → Binary 변환
    const cleanBase64 = imageBase64.replace(/^data:image\/[^;]+;base64,/, "");
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // RMBG-2.0 사용 (최고 성능 + 빠른 속도)
    const HF_MODEL = "briaai/RMBG-2.0";
    
    const response = await fetch(
  `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`,
  {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${HF_TOKEN}`,
      "Content-Type": "application/octet-stream",
      "HF-User-Agent": "elliesbang-image-editor"
    },
    body: bytes,
  }
);
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("🚨 Hugging Face API 오류:", errText);
      
      // 503: 모델 로딩 중 (첫 요청 시 발생 가능)
      if (response.status === 503) {
        try {
          const errorData = JSON.parse(errText);
          return new Response(
            JSON.stringify({ 
              error: "모델 준비 중입니다",
              estimated_time: errorData.estimated_time || 20,
              message: "잠시 후 다시 시도해주세요"
            }),
            { 
              status: 503,
              headers: { "Content-Type": "application/json" }
            }
          );
        } catch {
          return new Response(
            JSON.stringify({ 
              error: "모델 로딩 중",
              message: "20초 후 다시 시도해주세요"
            }),
            { 
              status: 503,
              headers: { "Content-Type": "application/json" }
            }
          );
        }
      }

      // 기타 오류
      return new Response(
        JSON.stringify({ 
          error: "배경 제거 실패",
          status: response.status,
          detail: errText 
        }),
        { 
          status: response.status,
          headers: { "Content-Type": "application/json" }
        }
      );
    }

    // 결과 이미지를 Base64로 변환
    const resultBuffer = await response.arrayBuffer();
    const resultBytes = new Uint8Array(resultBuffer);
    
    // Binary → Base64 변환 (메모리 효율적)
    let binary = '';
    const chunkSize = 0x8000; // 32KB 청크
    for (let i = 0; i < resultBytes.length; i += chunkSize) {
      const chunk = resultBytes.subarray(i, Math.min(i + chunkSize, resultBytes.length));
      binary += String.fromCharCode.apply(null, chunk);
    }
    const resultBase64 = btoa(binary);

    return new Response(
      JSON.stringify({ 
        image: `data:image/png;base64,${resultBase64}`,
        model: HF_MODEL
      }),
      { 
        headers: { 
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600"
        }
      }
    );

  } catch (err) {
    console.error("🚨 서버 오류:", err);
    return new Response(
      JSON.stringify({
        error: "서버 오류가 발생했습니다",
        detail: err.message,
      }),
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
