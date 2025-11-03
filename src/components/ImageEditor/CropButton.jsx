import React from "react";
import { getImageURL } from "./utils";

export default function CropButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const image = new Image();
      image.src = imgSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const cropWidth = image.width * 0.8;
      const cropHeight = image.height * 0.8;
      const startX = image.width * 0.1;
      const startY = image.height * 0.1;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(image, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const croppedBase64 = canvas.toDataURL("image/png").split(",")[1];
      const blob = await fetch(canvas.toDataURL("image/png")).then((r) => r.blob());
      const file = new File([blob], "cropped.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: croppedBase64 },
        })
      );

      alert("크롭 완료!");
    } catch (err) {
      console.error("크롭 오류:", err);
      alert("크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      크롭만
    </button>
  );
}
