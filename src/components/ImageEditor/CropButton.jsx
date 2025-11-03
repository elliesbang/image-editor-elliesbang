import React from "react";
import { getImageURL } from "./utils";

export default function CropButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      // ✅ Base64 추출
      const base64 = imgSrc.split(",")[1];

      // ✅ Cloudflare Function 호출
      const response = await fetch("/api/crop-v3", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      // ✅ 서버 응답 처리
      const data = await response.json();
      if (!data.image) throw new Error("서버에서 이미지가 반환되지 않았습니다.");

      // ✅ 응답받은 base64 → Blob → File 변환
      const croppedBase64 = data.image.split(",")[1];
      const blob = await fetch(`data:image/png;base64,${croppedBase64}`).then((r) =>
        r.blob()
      );
      const file = new File([blob], "cropped.png", { type: "image/png" });

      // ✅ 상위 컴포넌트에 완료 이벤트 전달
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: croppedBase64 },
        })
      );

      alert("✅ 서버 크롭 완료! (피사체 전체 유지)");
    } catch (err) {
      console.error("🚨 크롭 오류:", err);
      alert("크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      크롭만
    </button>
  );
}
