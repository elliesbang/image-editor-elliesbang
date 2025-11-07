import GIFEncoder from "gif-encoder";
import sharp from "sharp";
import { Buffer } from "node:buffer";
import {
  createImageResponse,
  handleError,
  parseFramePayload,
  readJsonBody,
  decodeImage,
  HttpError,
} from "./_utils.js";

const DEFAULT_DELAY = 100;

async function prepareFrame(buffer, width, height) {
  const pipeline = sharp(buffer).ensureAlpha();
  if (width && height) {
    pipeline.resize(width, height, { fit: "fill" });
  }
  const { data, info } = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });
  return { pixels: data, width: info.width, height: info.height };
}

export async function onRequestPost(context) {
  try {
    const body = await readJsonBody(context.request);
    const frames = parseFramePayload(body.frames);
    const buffers = frames.map((frame) => decodeImage(frame.image));

    if (buffers.length === 0) {
      throw new HttpError(400, "No frames provided");
    }

    const first = await prepareFrame(buffers[0]);
    const width = first.width;
    const height = first.height;
    const preparedFrames = [
      { pixels: first.pixels, delay: frames[0].delay ?? DEFAULT_DELAY },
    ];

    for (let i = 1; i < buffers.length; i += 1) {
      const prepared = await prepareFrame(buffers[i], width, height);
      preparedFrames.push({ pixels: prepared.pixels, delay: frames[i].delay ?? DEFAULT_DELAY });
    }

    const encoder = new GIFEncoder(width, height);
    const stream = encoder.createReadStream();
    const chunks = [];
    const completed = new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    encoder.start();
    encoder.setRepeat(0);
    encoder.setQuality(10);

    for (const frame of preparedFrames) {
      encoder.setDelay(frame.delay ?? DEFAULT_DELAY);
      encoder.addFrame(frame.pixels);
    }

    encoder.finish();
    await completed;

    const gifBuffer = Buffer.concat(chunks);
    return createImageResponse(gifBuffer, "image/gif");
  } catch (error) {
    return handleError(error);
  }
}
