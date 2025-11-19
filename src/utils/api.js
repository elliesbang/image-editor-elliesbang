export const API_BASE = "/.netlify/functions";

async function post(endpoint, payload, responseType = "blob") {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await safeReadError(response);
    throw new Error(message || `Request to ${endpoint} failed with ${response.status}`);
  }

  return responseType === "text" ? response.text() : response.blob();
}

async function safeReadError(response) {
  try {
    const data = await response.json();
    if (data && typeof data.error === "string") {
      return data.error;
    }
    return JSON.stringify(data);
  } catch {
    try {
      return await response.text();
    } catch {
      return "";
    }
  }
}

export async function removeBackground(image) {
  return post("/removeBg", { image });
}

export async function cropImage(image) {
  return post("/convert", { action: "crop", image });
}

export async function removeBackgroundAndCrop(image) {
  return post("/removeBg", { image, crop: true });
}

export async function denoiseImage(image) {
  return post("/convert", { action: "denoise", image });
}

export async function convertToSvg(image) {
  return post("/convert", { action: "svg", image }, "text");
}

export async function convertToGif(frames) {
  return post("/convert", { action: "gif", frames });
}
