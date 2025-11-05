import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      const processedResults = [];
      for (const [index, img] of selectedImages.entries()) {
        let imgSrc = getImageURL(img);
        if (!imgSrc) continue;

        // blob: URL → DataURL 변환
        if (!imgSrc.startsWith("data:image")) {
          const blob = await fetch(imgSrc).then((r) => r.blob());
          const reader = new FileReader();
          imgSrc = await new Promise((resolve) => {
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
        }

        // ✅ Cloudflare Function 호출
        const resp = await fetch("/api/remove-bg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imgSrc }),
        });

        const data = await resp.json();
        if (!data?.image) {
          console.error("🚨 배경제거 실패:", data);
          continue;
        }

        const resultBase64 = data.image;
        const dataUrl = resultBase64.startsWith("data:image")
          ? resultBase64
          : `data:image/png;base64,${resultBase64}`;

        const blob = await fetch(dataUrl).then((r) => r.blob());
        const file = new File([blob], `remove_bg_${index + 1}.png`, {
          type: "image/png",
        });

        processedResults.push({ file, dataUrl });
      }

      processedResults.forEach(({ file, dataUrl }) => {
        requestAnimationFrame(() => {
          window.dispatchEvent(
            new CustomEvent("imageProcessed", {
              detail: {
                file,
                thumbnail: dataUrl,
                meta: { label: "배경제거" },
              },
            })
          );
        });
      });

      alert(`✅ ${processedResults.length}개의 이미지 처리 완료!`);
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
