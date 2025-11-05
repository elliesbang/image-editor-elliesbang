import { optimize } from "svgo";

// ✅ Cloudflare Pages Functions entrypoint
export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64, maxColors = 6 } = await request.json();

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ success: false, error: "이미지 데이터가 없습니다." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // ✅ Base64 → Uint8Array 변환
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    const imageBytes = Uint8Array.from(atob(cleanBase64), (c) => c.charCodeAt(0));

    // ✅ Workers AI 실행 (Cloudflare 내부 모델)
    // 참고: https://developers.cloudflare.com/workers-ai/models/
    const aiResponse = await env.AI.run("@cf/image-to-vector", {
      image: [...imageBytes],
      color_limit: Math.min(Math.max(maxColors, 1), 6), // 1~6 색 제한
    });

    if (!aiResponse?.output_svg) {
      throw new Error("AI SVG 변환 실패");
    }

    let svg = aiResponse.output_svg;

    // ✅ 불필요한 stroke, fill-rule 등 제거
    svg = svg
      .replace(/\s(stroke(-width)?|fill-rule|clip-path|opacity)="[^"]*"/g, "")
      .replace(/\s+/g, " ");

    // ✅ viewBox 보장
    if (!/viewBox=/.test(svg)) {
      const match = svg.match(/width="(\d+)" height="(\d+)"/);
      if (match) {
        const [, w, h] = match;
        svg = svg.replace(
          /<svg/,
          `<svg viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"`
        );
      }
    }

    // ✅ 배경 fill 제거 (투명 유지)
    svg = svg.replace(/<rect[^>]+fill="[^"]+"[^>]*>/g, "");

    // ✅ svgo로 최적화 (150KB 이하 압축 목표)
    let optimized = optimize(svg, {
      multipass: true,
      floatPrecision: 2,
      plugins: [
        "removeDimensions",
        "removeMetadata",
        "removeTitle",
        "removeDesc",
        "removeRasterImages",
        "removeScriptElement",
        "collapseGroups",
        "convertShapeToPath",
        {
          name: "cleanupNumericValues",
          params: { floatPrecision: 2 },
        },
      ],
    });

    svg = optimized.data;

    // ✅ 크기 제한 확인 (150KB 초과 시 색상 절반으로 줄여 재시도)
    const encoder = new TextEncoder();
    let svgBytes = encoder.encode(svg);
    if (svgBytes.length > 150 * 1024) {
      const reduced = Math.max(1, Math.floor(maxColors / 2));
      const retry = await env.AI.run("@cf/image-to-vector", {
        image: [...imageBytes],
        color_limit: reduced,
      });
      const retriedSvg = optimize(retry.output_svg, { multipass: true }).data;
      svg = retriedSvg;
    }

    // ✅ 최종 응답
    return new Response(
      JSON.stringify({
        success: true,
        svg,
        meta: {
          colors: maxColors,
          size_kb: Math.round(svg.length / 1024),
          transparent: true,
          viewBox: /viewBox=/.test(svg),
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("🚨 SVG 변환 오류:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err.message || "서버 내부 오류",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
