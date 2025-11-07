import potrace from "potrace";
import sharp from "sharp";
import { promisify } from "node:util";
import { createTextResponse, handleError, readImagePayload } from "./_utils.js";

const traceAsync = promisify(potrace.trace);

export async function onRequestPost(context) {
  try {
    const { buffer } = await readImagePayload(context.request);
    const normalized = await sharp(buffer).png().toBuffer();
    const svg = await traceAsync(normalized);
    return createTextResponse(svg, "image/svg+xml;charset=utf-8");
  } catch (error) {
    return handleError(error);
  }
}
