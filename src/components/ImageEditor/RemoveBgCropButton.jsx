import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgCropButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      for (const [index, img] of selectedImages.entries()) {
        const imgSrc = getImageURL(img);
        if (!imgSrc) continue;

        // ✅ Cloudflare AI 배경제거 API 호출
        const res = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imgSrc }),
        });

        const data = await res.json();
        if (!data.success || !data.image) {
          console.error("🚨 remove-bg 실패:", data);
          continue;
        }

        const base64 = data.image;

        // ✅ AI가 반환한 투명 배경 이미지를 자동 크롭
        const autoCrop = async (src) =>
          new Promise((resolve) => {
            const image = new Image();
            image.src = src;
            image.onload = () => {
              const w = image.width, h = image.height;
              const canvas = document.createElement("canvas");
              canvas.width = w; canvas.height = h;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(image, 0, 0);

              const imgData = ctx.getImageData(0, 0, w, h);
              const data = imgData.data;

              let minX = w, minY = h, maxX = 0, maxY = 0;
              for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                  const alpha = data[(y * w + x) * 4 + 3];
                  if (alpha > 10) { // 피사체 픽셀
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
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
                .drawImage(canvas, minX, minY, cropW, cropH, 0, 0, cropW, cropH);

              resolve(out.toDataURL("image/png"));
            };
          });

        const croppedBase64 = await autoCrop(base64);

        // ✅ Blob 변환 + ProcessResult 전송
        const blob = await fetch(croppedBase64).then((r) => r.blob());
        const file = new File([blob], `removed_cropped_${index + 1}.png`, {
          type: "image/png",
        });

        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: {
              file,
              thumbnail: croppedBase64,
              meta: { label: "배경제거+크롭" },
            },
          })
        );
      }

      alert(`✅ ${selectedImages.length}개의 이미지 배경제거+크롭 완료!`);
    } catch (err) {
      console.error("🚨 배경제거+크롭 오류:", err);
      alert("배경제거+크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거+크롭
    </button>
  );
}
