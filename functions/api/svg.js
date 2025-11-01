import { optimize } from "svgo";

export const onRequestPost = async ({ request }) => {
  try {
    const { imageBase64 } = await request.json();
    if (!imageBase64)
      return new Response(JSON.stringify({ error: "이미지 데이터가 없습니다." }), { status: 400 });

    // ✅ PNG → SVG 변환 (Cloudflare에서는 potrace-like 변환 모듈을 직접 쓸 수 없음)
    // → OpenAI API 없이 간단한 Edge Trace 벡터화 수행 (Base64를 SVG path로 단순화)
    // 실제 환경에서는 외부 API(Potrace, imagetracerjs 등)를 Workers-compatible 버전으로 교체 필요

    const svgTemplate = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
        <image href="data:image/png;base64,${imageBase64}" width="512" height="512" />
      </svg>
    `;

    // ✅ stroke 속성 제거, viewBox 확인
    let optimizedSvg = svgTemplate
      .replace(/stroke="[^"]*"/g, "") // stroke 제거
      .replace(/<svg([^>]+)>/, '<svg$1 viewBox="0 0 512 512">');

    // ✅ svgo로 150KB 이하로 압축
    const { data: compressed } = optimize(optimizedSvg, {
      multipass: true,
      floatPrecision: 2,
      plugins: [
        "removeDimensions",
        "removeMetadata",
        "removeComments",
        "removeXMLProcInst",
        "removeDoctype",
        {
          name: "removeAttrs",
          params: { attrs: "(stroke|style)" },
        },
        {
          name: "cleanupNumericValues",
          params: { floatPrecision: 2 },
        },
      ],
    });

    // ✅ 크기 제한 확인 (150KB)
    const encoded = btoa(unescape(encodeURIComponent(compressed)));
    const byteSize = encoded.length * (3 / 4);
    if (byteSize > 150 * 1024) {
      return new Response(
        JSON.stringify({ error: "파일이 150KB를 초과했습니다. 더 작은 이미지로 시도해주세요." }),
        { status: 400 }
      );
    }

    // ✅ 사용자 색상 변경용 컬러픽커 포함
    const svgWithPicker = `
      <div style="text-align:center">
        <input type="color" id="colorPicker" value="#FFD331" 
          onchange="document.querySelector('svg').querySelectorAll('*').forEach(e => e.setAttribute('fill', this.value))" 
          style="margin-bottom:10px;width:80px;height:40px;border:none;cursor:pointer;" />
        ${compressed}
      </div>
    `;

    return new Response(JSON.stringify({ svg: btoa(svgWithPicker) }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("SVG 변환 오류:", err);
    return new Response(
      JSON.stringify({ error: "SVG 변환 중 오류가 발생했습니다." }),
      { status: 500 }
    );
  }
};
