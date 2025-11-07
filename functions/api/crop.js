import sharp from "sharp";
import { createImageResponse, handleError, readImagePayload } from "./_utils.js";

export async function onRequestPost(context) {
  try {
    const { buffer } = await readImagePayload(context.request);
    const trimmed = await sharp(buffer).trim().png().toBuffer();
    return createImageResponse(trimmed, "image/png");
  } catch (error) {
    return handleError(error);
  }
}
