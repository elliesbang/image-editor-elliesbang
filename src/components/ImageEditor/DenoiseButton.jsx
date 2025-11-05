import React from "react";
import { getImageURL } from "./utils";

export default function DenoiseButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      const processedResults = [];
      for (const [index, img] of selectedImages.entries()) {
        const imgSrc = getImageURL(img);
        if (!imgSrc) continue;

        const res = await fetch("/api/denoise", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imgSrc }),
        });

        const data = await res.json();
        if (!data.success || !data.image) {
          console.error("🚨 노이즈 제거 실패:", data);
          continue;
        }

        const cleanBase64 = data.image;
        const blob = await fetch(cleanBase64).then((r) => r.blob());
        const file = new File([blob], `denoised_${index + 1}.png`, {
          type: "image/png",
        });

        processedResults.push({ file, dataUrl: cleanBase64 });
      }

      processedResults.forEach(({ file, dataUrl }) => {
        requestAnimationFrame(() => {
          window.dispatchEvent(
            new CustomEvent("imageProcessed", {
              detail: {
                file,
                thumbnail: dataUrl,
                meta: { label: "노이즈제거" },
              },
            })
          );
        });
      });

      alert(`✅ ${processedResults.length}개의 이미지 처리 완료!`);
    } catch (err) {
      console.error("🚨 노이즈 제거 오류:", err);
      alert("노이즈 제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      노이즈 제거
    </button>
  );
}
