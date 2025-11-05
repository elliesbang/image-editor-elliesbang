export const onRequestPost = async ({ request, env }) => {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64)
      return new Response(JSON.stringify({ error: "No image provided" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });

    // ✅ Cloudflare AI 호출
    const result = await env.AI.run("@cf/elliesbang/remove-background", {
      image: imageBase64,
    });

    return new Response(JSON.stringify(result), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg function error:", err);
    return new Response(
      JSON.stringify({ error: "remove-bg failed", message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
