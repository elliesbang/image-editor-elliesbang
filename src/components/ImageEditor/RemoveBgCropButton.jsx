import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgCropButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    // ✅ Base64 안전 추출 + 유효성 검사
    const base64 = imgSrc.includes(",") ? imgSrc.split(",")[1] : imgSrc;

    if (!base64 || base64.length < 100) {
      alert("이미지 데이터가 비정상적이에요. 다시 업로드해주세요.");
      console.error("🚨 base64 추출 실패:", imgSrc);
      return;
    }

    try {
      console.log("🚀 서버로 전송 중:", base64.slice(0, 50) + "...");

      const res = await fetch("/api/remove-bg", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageBase64: base64 }),
});

const data = await res.json();
if (!res.ok || !data.image) throw new Error("배경제거 실패 또는 이미지 없음");

      if (!res.ok) {
        alert(`서버 오류 (${res.status})`);
        console.error("❌ 서버 응답:", data);
        return;
      }

      if (!data.image) throw new Error("서버에서 결과 이미지를 반환하지 않았습니다.");

      // ✅ Blob/File 변환
      const croppedBase64 = await autoCrop(data.image);
const fileBlob = await fetch(croppedBase64).then((r) => r.blob());
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
