const DATA_URL_PREFIX = /^data:image\/[a-zA-Z0-9+.-]+;base64,/;

const readFileAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result || "");
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    } catch (error) {
      reject(error);
    }
  });

const shouldFetch = (value) =>
  typeof value === "string" && /^(https?:|blob:)/i.test(value);

export async function toBase64(image) {
  if (!image) return "";

  if (typeof image === "string") {
    return image.startsWith("data:image")
      ? image
      : `data:image/png;base64,${stripDataUrlPrefix(image)}`;
  }

  if (image instanceof File || image instanceof Blob) {
    return await readFileAsDataUrl(image);
  }

  if (typeof image === "object") {
    if (image.file instanceof File || image.file instanceof Blob) {
      return await readFileAsDataUrl(image.file);
    }

    const candidate = image.thumbnail || image.src || image.url;
    if (typeof candidate === "string" && candidate.length > 0) {
      if (candidate.startsWith("data:image")) {
        return candidate;
      }

      if (shouldFetch(candidate)) {
        const blob = await fetch(candidate).then((r) => r.blob());
        return await readFileAsDataUrl(blob);
      }

      return `data:image/png;base64,${stripDataUrlPrefix(candidate)}`;
    }
  }

  return "";
}

export function ensureDataUrl(value, fallbackMime = "image/png") {
  if (!value) return "";
  if (value.startsWith("data:image")) return value;
  return `data:${fallbackMime};base64,${stripDataUrlPrefix(value)}`;
}

export function dispatchResult(src, label, options = {}) {
  if (typeof window === "undefined") return;

  const { file, meta = {}, result } = options;
  const detail = {
    meta: { label, ...meta },
  };

  if (src) {
    detail.thumbnail = ensureDataUrl(src);
  }

  if (file instanceof File) {
    detail.file = file;
  }

  if (result) {
    detail.result = result;
  }

  window.dispatchEvent(new CustomEvent("imageProcessed", { detail }));
}

export async function dataUrlToFile(dataUrl, filename, mimeType = "image/png") {
  const normalized = ensureDataUrl(dataUrl, mimeType);
  const res = await fetch(normalized);
  const blob = await res.blob();
  return new File([blob], filename, { type: mimeType });
}

export const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = src;
  });

export async function cropTransparentImage(dataUrl, alphaThreshold = 5) {
  const image = await loadImage(dataUrl);
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0, width, height);

  const { data } = ctx.getImageData(0, 0, width, height);
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > alphaThreshold) {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (minX > maxX || minY > maxY) {
    return canvas.toDataURL("image/png");
  }

  const cropWidth = maxX - minX + 1;
  const cropHeight = maxY - minY + 1;

  const output = document.createElement("canvas");
  output.width = cropWidth;
  output.height = cropHeight;
  output
    .getContext("2d")
    .drawImage(
      canvas,
      minX,
      minY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

  return output.toDataURL("image/png");
}

export async function runWorkerAI(model, payload, fallback) {
  try {
    if (typeof globalThis !== "undefined" && globalThis.AI?.run) {
      return await globalThis.AI.run(model, payload);
    }
  } catch (error) {
    console.error("AI.run 호출 실패", error);
  }

  if (typeof fallback === "function") {
    return await fallback();
  }

  throw new Error("AI 모델을 실행할 수 없습니다.");
}

export function normalizeLoopableImages(list = []) {
  if (!Array.isArray(list)) return [];
  return list.filter(Boolean);
}

export function stripDataUrlPrefix(value = "") {
  return value.replace(DATA_URL_PREFIX, "");
}
