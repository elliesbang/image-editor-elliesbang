import sharp from "sharp";
import {
  createImageResponse,
  ensureAIImage,
  handleError,
  readImagePayload,
  toArrayBuffer,
} from "./_utils.js";

const MODEL = "@cf/unum/u2net-portrait";

export async function onRequestPost(context) {
  try {
    const { buffer } = await readImagePayload(context.request);
    const aiResult = await context.env.AI.run(MODEL, { image: toArrayBuffer(buffer) });
    const withoutBackground = ensureAIImage(aiResult);
    const trimmed = await sharp(withoutBackground).trim().png().toBuffer();
    return createImageResponse(trimmed, "image/png");
  } catch (error) {
    return handleError(error);
  }
}
