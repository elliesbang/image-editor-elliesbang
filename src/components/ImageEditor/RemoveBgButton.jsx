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
        imgSrc = await new Promise((resolve) => {
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      }

      // ✅ 서버로 요청 전송
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imgSrc,
          originalName: selectedImage?.file?.name || "uploaded_image.png",
        }),
      });

      const data = await res.json();

      // ✅ 서버 응답 검증
      if (!data.success || !data.processed) {
        console.error("🚨 remove-bg 실패:", data);
        return alert("배경제거 중 오류가 발생했습니다.");
      }

      // ✅ 처리결과 데이터 받아오기
      const { processed } = data;

      // ✅ Blob 파일 생성 (선택사항)
      const blob = await fetch(processed.thumbnail).then((r) => r.blob());
      const file = new File([blob], processed.name || "remove_bg.png", {
        type: "image/png",
      });

      // ✅ 전역 이벤트로 처리결과 섹션에 업로드 알림
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: {
            file,
            thumbnail: processed.thumbnail,
            id: processed.id,
            type: "processed",
          },
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
