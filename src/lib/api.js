export function fetchImageMetadata(imageId) {
  return Promise.resolve({ id: imageId, status: "ready" });
}
