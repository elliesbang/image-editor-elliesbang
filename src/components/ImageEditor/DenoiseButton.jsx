import React from "react";
import { getImageURL } from "./utils";

export default function DenoiseButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const image = new Image();
      image.src = imgSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = image.width;
      canvas.height = image.height;

      ctx.filter = "blur(1px) contrast(110%) brightness(105%)";
      ctx.drawImage(image, 0, 0);

      const denoisedBase64 = canvas.toDataURL("image/png").split(",")[1];
      const blob = await fetch(canvas.toDataURL("image/png")).then((r) => r.blob());
      const file = new File([blob], "denoised.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: denoisedBase64 },
        })
      );

      alert("노이즈 제거 완료!");
    } catch (err) {
      console.error("노이즈 제거 오류:", err);
      alert("노이즈 제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      노이즈 제거
    </button>
  );
}
