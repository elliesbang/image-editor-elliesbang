import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      for (const [index, img] of selectedImages.entries()) {
        const imgSrc = getImageURL(img);
        if (!imgSrc) continue;

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

        const processedBase64 = data.image;
        const blob = await fetch(processedBase64).then((r) => r.blob());
        const file = new File([blob], `removed_${index + 1}.png`, {
          type: "image/png",
        });

        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: {
              file,
              thumbnail: processedBase64,
              meta: { label: "배경제거" },
            },
          })
        );
      }

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
