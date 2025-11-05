import React from "react";
import { getImageURL } from "./utils";

export default function CropButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      for (const [index, img] of selectedImages.entries()) {
        const imgSrc = getImageURL(img);
        if (!imgSrc) continue;

        // ✅ Cloudflare AI로 피사체 마스크 추출
        const res = await fetch("/api/segment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imgSrc }),
        });

        const data = await res.json();
        if (!data.success || !data.image) {
          console.error("🚨 crop 실패:", data);
          continue;
        }

        const segmented = data.image;

        // ✅ 투명 배경을 기반으로 자동 크롭
        const autoCrop = async (src) =>
          new Promise((resolve) => {
            const image = new Image();
            image.src = src;
            image.onload = () => {
              const w = image.width;
              const h = image.height;
              const c = document.createElement("canvas");
              c.width = w;
              c.height = h;
              const ctx = c.getContext("2d");
              ctx.drawImage(image, 0, 0, w, h);

              const { data } = ctx.getImageData(0, 0, w, h);
              let minX = w,
                minY = h,
                maxX = 0,
                maxY = 0;

              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const a = data[(y * w + x) * 4 + 3];
                  if (a > 10) {
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                  }
                }
              }

              const cropW = maxX - minX + 1;
              const cropH = maxY - minY + 1;

              const out = document.createElement("canvas");
              out.width = cropW;
              out.height = cropH;
              out
                .getContext("2d")
                .drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

              resolve(out.toDataURL("image/png"));
            };
          });

        const croppedBase64 = await autoCrop(segmented);
        const blob = await fetch(croppedBase64).then((r) => r.blob());
        const file = new File([blob], `cropped_${index + 1}.png`, {
          type: "image/png",
        });

        // ✅ 처리결과 섹션으로 전송
        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: {
              file,
              thumbnail: croppedBase64,
              meta: { label: "AI 크롭" },
            },
          })
        );
      }

      alert(`✅ ${selectedImages.length}개의 이미지 자동 크롭 완료!`);
    } catch (err) {
      console.error("🚨 AI 크롭 오류:", err);
      alert("AI 크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      크롭만
    </button>
  );
}
