import { ensureAIImage, handleError, readImagePayload, toArrayBuffer, createImageResponse } from "./_utils.js";

const MODEL = "@cf/unum/u2net-portrait";

export async function onRequestPost(context) {
  try {
    const { buffer } = await readImagePayload(context.request);
    const aiResult = await context.env.AI.run(MODEL, { image: toArrayBuffer(buffer) });
    const output = ensureAIImage(aiResult);
    return createImageResponse(output, "image/png");
  } catch (error) {
    return handleError(error);
  }
}
