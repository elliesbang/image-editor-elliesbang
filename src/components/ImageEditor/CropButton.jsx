import React from "react";
import { getImageURL } from "./utils";

export default function CropButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      // 여러 이미지 병렬 처리
      await Promise.all(
        selectedImages.map(async (img, index) => {
          const imgSrc = getImageURL(img);
          if (!imgSrc) return;

          // ✅ 프론트 자동 크롭
          const autoCrop = (src) =>
            new Promise((resolve) => {
              const image = new Image();
              image.src = src;
              image.onload = () => {
                const w = image.width,
                  h = image.height;
                const c = document.createElement("canvas");
                c.width = w;
                c.height = h;
                const ctx = c.getContext("2d");
                ctx.drawImage(image, 0, 0);

                const { data } = ctx.getImageData(0, 0, w, h);
                let minX = w,
                  minY = h,
                  maxX = 0,
                  maxY = 0;
                const alphaThreshold = 10;

                for (let y = 0; y < h; y++) {
                  for (let x = 0; x < w; x++) {
                    const a = data[(y * w + x) * 4 + 3];
                    if (a > alphaThreshold) {
                      minX = Math.min(minX, x);
                      minY = Math.min(minY, y);
                      maxX = Math.max(maxX, x);
                      maxY = Math.max(maxY, y);
                    }
                  }
                }

                const pad = 1;
                minX = Math.max(0, minX - pad);
                minY = Math.max(0, minY - pad);
                maxX = Math.min(w - 1, maxX + pad);
                maxY = Math.min(h - 1, maxY + pad);

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

          // ✅ Base64 → Blob 변환
          const croppedBase64Full = await autoCrop(imgSrc);
          const croppedBase64 = croppedBase64Full.split(",")[1];
          const blob = await fetch(
            `data:image/png;base64,${croppedBase64}`
          ).then((r) => r.blob());
          const file = new File([blob], `cropped_${index + 1}.png`, {
            type: "image/png",
          });

          // ✅ 각 이미지마다 개별 이벤트 발생
          window.dispatchEvent(
            new CustomEvent("imageProcessed", {
              detail: {
                file,
                thumbnail: croppedBase64Full,
                meta: { label: "크롭" },
              },
            })
          );
        })
      );

      alert(`✅ ${selectedImages.length}개의 이미지 크롭 완료!`);
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
