import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const base64 = imgSrc.split(",")[1];
      const response = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await response.json();
      if (!data.image) throw new Error("서버에서 이미지가 반환되지 않았습니다.");

      const cleanedBase64 = data.image.split(",")[1];
      const blob = await fetch(`data:image/png;base64,${cleanedBase64}`).then((r) =>
        r.blob()
      );
      const file = new File([blob], "background_removed.png", {
        type: "image/png",
      });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: cleanedBase64 },
        })
      );

      alert("✅ 배경제거 완료!");
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
