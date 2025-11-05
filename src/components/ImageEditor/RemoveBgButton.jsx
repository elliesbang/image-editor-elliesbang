import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImages = [], disabled }) {
  const handleClick = async () => {
    if (!selectedImages.length)
      return alert("이미지를 하나 이상 선택하세요!");

    try {
      await Promise.all(
        selectedImages.map(async (img, index) => {
          let imgSrc = getImageURL(img);
          if (!imgSrc) return;

          // blob: URL → DataURL 변환
          if (!imgSrc.startsWith("data:image")) {
            const blob = await fetch(imgSrc).then((r) => r.blob());
            const reader = new FileReader();
            imgSrc = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }

          // ✅ 워커 AI 바인딩 호출
          const resp = await AI.run("@cf/elliesbang/remove-background", {
            image: imgSrc,
          });

          if (!resp?.image) {
            console.error("🚨 배경제거 실패:", resp);
            return;
          }

          const resultBase64 = resp.image;
          const dataUrl = resultBase64.startsWith("data:image")
            ? resultBase64
            : `data:image/png;base64,${resultBase64}`;

          const blob = await fetch(dataUrl).then((r) => r.blob());
          const file = new File([blob], `remove_bg_${index + 1}.png`, {
            type: "image/png",
          });

          // ✅ 처리결과로 전달
          window.dispatchEvent(
            new CustomEvent("imageProcessed", {
              detail: {
                file,
                thumbnail: dataUrl,
                meta: { label: "배경제거" },
              },
            })
          );
        })
      );

      alert(`✅ ${selectedImages.length}개의 이미지 배경제거 완료!`);
    } catch (err) {
      console.error("🚨 워커 AI 배경제거 오류:", err);
      alert("배경제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거
    </button>
  );
}
