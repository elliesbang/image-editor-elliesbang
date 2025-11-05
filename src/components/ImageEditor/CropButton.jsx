import React from "react";
import { getImageURL } from "./utils";

export default function CropButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      // ✅ Base64 추출
      const base64 = imgSrc.split(",")[1];

     // ✅ 프론트 자동 크롭으로 대체
const autoCrop = (src) =>
  new Promise((resolve) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const { data } = ctx.getImageData(0, 0, img.width, img.height);

      let minX = img.width, minY = img.height, maxX = 0, maxY = 0;

      for (let y = 0; y < img.height; y++) {
        for (let x = 0; x < img.width; x++) {
          const a = data[(y * img.width + x) * 4 + 3];
          if (a > 2) {
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
          }
        }
      }

      const w = maxX - minX + 1;
      const h = maxY - minY + 1;
      const out = document.createElement("canvas");
      out.width = w;
      out.height = h;
      out.getContext("2d").drawImage(canvas, minX, minY, w, h, 0, 0, w, h);
      resolve(out.toDataURL("image/png"));
    };
  });

const croppedBase64Full = await autoCrop(imgSrc);
const croppedBase64 = croppedBase64Full.split(",")[1];
      
      const blob = await fetch(`data:image/png;base64,${croppedBase64}`).then((r) =>
        r.blob()
      );
      const file = new File([blob], "cropped.png", { type: "image/png" });

      // ✅ 상위 컴포넌트에 완료 이벤트 전달
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: croppedBase64 },
        })
      );

      alert("✅ 서버 크롭 완료! (피사체 전체 유지)");
    } catch (err) {
      console.error("🚨 크롭 오류:", err);
      alert("크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      크롭만
    </button>
  );
}
