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

          // blob: URL이면 dataURL로 변환
          if (!imgSrc.startsWith("data:image")) {
            const blob = await fetch(imgSrc).then((r) => r.blob());
            const reader = new FileReader();
            imgSrc = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }

          // Base64 → Binary 변환
          const cleanBase64 = imgSrc.replace(/^data:image\/[^;]+;base64,/, "");
          const binary = Uint8Array.from(atob(cleanBase64), (c) =>
            c.charCodeAt(0)
          );

          // ✅ Cloudflare Workers AI 호출
          const response = await fetch(
            "https://api.cloudflare.com/client/v4/accounts/" +
              import.meta.env.VITE_CF_ACCOUNT_ID +
              "/ai/run/@cf/elliesbang/remove-background",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${import.meta.env.VITE_CF_API_TOKEN}`,
                "Content-Type": "application/octet-stream",
              },
              body: binary,
            }
          );

          if (!response.ok) {
            console.error("🚨 워커AI 배경제거 실패:", await response.text());
            return;
          }

          const arrayBuffer = await response.arrayBuffer();
          const resultBase64 = btoa(
            String.fromCharCode(...new Uint8Array(arrayBuffer))
          );
          const dataUrl = `data:image/png;base64,${resultBase64}`;

          // Blob & File 생성
          const blob = await fetch(dataUrl).then((r) => r.blob());
          const file = new File([blob], `remove_bg_${index + 1}.png`, {
            type: "image/png",
          });

          // ✅ ProcessResult 섹션에 반영
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
      console.error("🚨 워커AI 배경제거 오류:", err);
      alert("배경제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거
    </button>
  );
}
