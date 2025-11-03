import React from "react";
import { getImageURL } from "./utils";

export default function RemoveBgButton({ selectedImage, disabled }) {
  const handleClick = async () => {
    const imgSrc = getImageURL(selectedImage);
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const binary = new Uint8Array(await blob.arrayBuffer());
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: binary,
      });
      const data = await res.json();
      if (!data.result) throw new Error("배경제거 실패");

      const fileBlob = await fetch(`data:image/png;base64,${data.result}`).then((r) =>
        r.blob()
      );
      const file = new File([fileBlob], "bg_removed.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: data.result },
        })
      );
      alert("배경제거 완료!");
    } catch (err) {
      console.error("배경제거 오류:", err);
      alert("배경제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled}>
      배경제거
    </button>
  );
}
