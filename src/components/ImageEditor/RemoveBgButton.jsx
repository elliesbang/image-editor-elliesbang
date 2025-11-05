import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      // 여러 이미지 병렬 처리
      await Promise.all(
        selectedImages.map(async (img, index) => {
          const imgSrc = getImageURL(img);
          if (!imgSrc) return;

          const removeBackground = (src) =>
            new Promise((resolve) => {
              const image = new Image();
              image.src = src;
              image.onload = () => {
                const w = image.width;
                const h = image.height;

                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(image, 0, 0, w, h);

                const imageData = ctx.getImageData(0, 0, w, h);
                const data = imageData.data;

                // ✅ 흰색 또는 밝은 영역 자동 투명화
                for (let i = 0; i < data.length; i += 4) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  const brightness = (r + g + b) / 3;
                  if (brightness > 240) {
                    // 밝은 배경일 경우 알파값을 0으로
                    data[i + 3] = 0;
                  }
                }

                ctx.putImageData(imageData, 0, 0);
                resolve(canvas.toDataURL("image/png"));
              };
            });

          const processedBase64 = await removeBackground(imgSrc);
          const blob = await fetch(processedBase64).then((r) => r.blob());
          const file = new File([blob], `removed_${index + 1}.png`, {
            type: "image/png",
          });

          // ✅ ProcessResult로 전송
          window.dispatchEvent(
            new CustomEvent("imageProcessed", {
              detail: {
                file,
                thumbnail: processedBase64,
                meta: { label: "배경제거" },
              },
            })
          );
        })
      );

      alert(`✅ ${selectedImages.length}개의 이미지 배경제거 완료!`);
    } catch (err) {
      console.error("🚨 배경제거 오류:", err);
      alert("배경제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거
    </button>
  );
}
