import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    try {
      let imgSrc = getImageURL(selectedImage);
      if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

      // ✅ blob: URL이면 dataURL로 변환
      if (!imgSrc.startsWith("data:image")) {
        const blob = await fetch(imgSrc).then((r) => r.blob());
        const reader = new FileReader();
        const base64 = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(blob);
        });
        imgSrc = `data:image/png;base64,${base64}`;
      }

      const base64 = imgSrc.split(",")[1];

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (!data.image) throw new Error("배경제거 실패");

      const fileBlob = await fetch(data.image).then((r) => r.blob());
      const file = new File([fileBlob], "remove_bg.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: data.image.split(",")[1] },
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
