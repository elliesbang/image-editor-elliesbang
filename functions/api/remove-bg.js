export const onRequestPost = async ({ request, env }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "이미지가 없습니다." }), { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    const response = await fetch("https://api-inference.huggingface.co/models/Sanster/lama-cleaner", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: bytes,
    });

    if (!response.ok) {
      throw new Error(`API 요청 실패 (${response.status})`);
    }

    const resultBuffer = await response.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(resultBuffer)));

    return new Response(JSON.stringify({ result: base64, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 remove-bg 오류:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
