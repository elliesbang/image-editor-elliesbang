export const MODELS = {
  REMOVE_BG: "@cf/elliesbang/remove-background",
  SEGMENT: "@cf/segment-anything",
  DENOISE: "@cf/real-esrgan",
  SVG: "@cf/lykon/dreamshaper-8-lcm",
  GIF: "@cf/lykon/blink",
  KEYWORD: "@cf/llava-hf/llava-1.5-7b-hf",
};

export const API_ENDPOINTS = {
  REMOVE_BG: "/.netlify/functions/removeBg",
  CROP: "/.netlify/functions/convert",
  DENOISE: "/.netlify/functions/convert",
  SVG: "/.netlify/functions/convert",
  GIF: "/.netlify/functions/convert",
  KEYWORD: "/.netlify/functions/convert",
};

export const ALERT_MESSAGES = {
  NO_SELECTION: "이미지를 선택하세요!",
  BACKGROUND_DONE: (count) => `✅ ${count}개의 이미지 배경제거 완료!`,
  BACKGROUND_CROP_DONE: (count) => `✅ ${count}개 이미지 배경제거+크롭 완료!`,
  CROP_DONE: (count) => `✅ ${count}개의 이미지 자동 크롭 완료!`,
  DENOISE_DONE: (count) => `✅ ${count}개의 이미지 노이즈 제거 완료!`,
  RESIZE_DONE: (count) => `✅ ${count}개의 이미지 리사이즈 완료!`,
  SVG_DONE: (count) => `✅ ${count}개의 이미지 SVG 변환 완료!`,
  GIF_DONE: (count) => `✅ ${count}개의 GIF 변환 완료!`,
  KEYWORD_DONE: (count) => `✅ ${count}개의 이미지 키워드 분석 완료!`,
};
