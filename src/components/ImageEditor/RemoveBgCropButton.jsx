import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgCropButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      await Promise.all(
        selectedImages.map(async (img, idx) => {
          const imgSrc = getImageURL(img);
          if (!imgSrc) return;

          // ✅ 1️⃣ 배경제거 (현재 remove-bg.js와 동일 구조)
          const response = await fetch("/api/remove-bg", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imageBase64: imgSrc }),
          });

          if (!response.ok) throw new Error("배경제거 실패");
          const { image: bgRemovedBase64 } = await response.json();
          if (!bgRemovedBase64) throw new Error("배경제거 결과 없음");

          // ✅ 2️⃣ 자동 크롭 (CropButton의 최신 버전 그대로 적용)
          const autoCrop = (src) =>
            new Promise((resolve) => {
              const image = new Image();
              image.src = src;
              image.onload = () => {
                const w = image.width, h = image.height;
                const c = document.createElement("canvas");
                c.width = w; c.height = h;
                const ctx = c.getContext("2d");
                ctx.drawImage(image, 0, 0);

                const { data } = ctx.getImageData(0, 0, w, h);
                let minX = w, minY = h, maxX = 0, maxY = 0;
                const alphaThreshold = 10; // 🔥 투명도 기준 강화 (fringe 제거)

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

                const pad = 1; // 🔥 여백 1px만 허용
                minX = Math.max(0, minX - pad);
                minY = Math.max(0, minY - pad);
                maxX = Math.min(w - 1, maxX + pad);
                maxY = Math.min(h - 1, maxY + pad);

                const cropW = maxX - minX + 1;
                const cropH = maxY - minY + 1;

                const out = document.createElement("canvas");
                out.width = cropW; out.height = cropH;
                out.getContext("2d").drawImage(c, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

                resolve(out.toDataURL("image/png"));
              };
            });

          const croppedBase64Full = await autoCrop(bgRemovedBase64);

          // ✅ 3️⃣ Blob + File 변환
          const blob = await fetch(croppedBase64Full).then((r) => r.blob());
          const file = new File([blob], `removed_cropped_${idx + 1}.png`, {
            type: "image/png",
          });

          // ✅ 4️⃣ 처리결과 섹션에 전달 (ProcessResult.jsx가 자동 수신)
          requestAnimationFrame(() => {
            window.dispatchEvent(
              new CustomEvent("imageProcessed", {
                detail: {
                  file,
                  thumbnail: croppedBase64Full,
                  meta: { label: "배경제거+크롭" },
                },
              })
            );
          });
        })
      );

      alert(`✅ ${selectedImages.length}개의 이미지 배경제거+크롭 완료!`);
    } catch (err) {
      console.error("🚨 배경제거+크롭 오류:", err);
      alert("배경제거+크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거 + 크롭
    </button>
  );
}
