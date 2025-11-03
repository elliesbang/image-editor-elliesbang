import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgCropButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      // ✅ Base64 추출
      const base64 = imgSrc.split(",")[1];

      // ✅ 서버로 JSON 형식 전송
      const res = await fetch("/api/remove-bg-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();

      // ✅ 서버에서 반환된 Base64 확인
      if (!data.image) throw new Error("서버에서 결과 이미지를 반환하지 않았습니다.");

      // ✅ Blob/File 변환
      const fileBlob = await fetch(data.image).then((r) => r.blob());
      const file = new File([fileBlob], "bg_crop.png", { type: "image/png" });

      // ✅ 전역 이벤트로 결과 전달
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: data.image.split(",")[1] },
        })
      );

      alert("✅ 배경제거 + 크롭 완료!");
    } catch (err) {
      console.error("🚨 배경제거+크롭 오류:", err);
      alert("배경제거+크롭 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거 + 크롭
    </button>
  );
}
