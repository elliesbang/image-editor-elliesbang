export function calculateAspectRatio(width, height) {
  return height === 0 ? 0 : width / height;
}

export function getResizedDimensions(width, height, maxWidth, maxHeight) {
  const ratio = Math.min(maxWidth / width, maxHeight / height, 1);
  return { width: Math.round(width * ratio), height: Math.round(height * ratio) };
}
