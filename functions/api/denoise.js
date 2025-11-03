export const onRequestPost = async ({ request }) => {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image");
    if (!imageFile)
      return new Response(JSON.stringify({ error: "이미지가 없습니다." }), { status: 400 });

    const blob = await imageFile.arrayBuffer();
    const imageBitmap = await createImageBitmap(await new Blob([blob]));
    const canvas = new OffscreenCanvas(imageBitmap.width, imageBitmap.height);
    const ctx = canvas.getContext("2d");

    ctx.filter = "blur(1.5px)";
    ctx.drawImage(imageBitmap, 0, 0);

    const blobResult = await canvas.convertToBlob({ type: "image/png" });
    const buffer = await blobResult.arrayBuffer();
    const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));

    return new Response(JSON.stringify({ result: base64, success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("🚨 denoise 오류:", err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      status: 500,
    });
  }
};
