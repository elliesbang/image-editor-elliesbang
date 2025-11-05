// src/utils/removeBg.js
import * as ort from "onnxruntime-web";

export async function removeBackground(imageBase64) {
  const img = await createImageBitmap(await fetch(imageBase64).then(r => r.blob()));
  const tensor = await imageToTensor(img);

  const session = await ort.InferenceSession.create(
    "https://cdn.jsdelivr.net/gh/elliesbang/models/rmbg-1.4.onnx"
  );
  const feeds = { input: tensor };
  const results = await session.run(feeds);
  const mask = results.output.data;

  const outputBlob = await applyMaskToImage(img, mask);
  return URL.createObjectURL(outputBlob);
}

async function imageToTensor(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, image.width, image.height);

  const floatData = new Float32Array(image.width * image.height * 3);
  for (let i = 0; i < image.width * image.height; i++) {
    floatData[i * 3] = imgData.data[i * 4] / 255;
    floatData[i * 3 + 1] = imgData.data[i * 4 + 1] / 255;
    floatData[i * 3 + 2] = imgData.data[i * 4 + 2] / 255;
  }
  return new ort.Tensor("float32", floatData, [1, 3, image.height, image.width]);
}

async function applyMaskToImage(image, mask) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  const imgData = ctx.getImageData(0, 0, image.width, image.height);

  for (let i = 0; i < image.width * image.height; i++) {
    imgData.data[i * 4 + 3] = Math.min(Math.max(mask[i] * 255, 0), 255);
  }
  ctx.putImageData(imgData, 0, 0);
  return await new Promise((res) => canvas.toBlob(res, "image/png"));
}