import React, { useState } from "react";
import { getImageURL } from "../ImageEditor/utils";

export default function GifConvertTool({ selectedResults = [], disabled }) {
  const [loading, setLoading] = useState(false);
  const [loop, setLoop] = useState(true);

  const hasSelected = Array.isArray(selectedResults) && selectedResults.length > 0;

  const handleGifConvert = async () => {
    if (!hasSelected)
      return alert("처리결과 섹션에서 이미지를 하나 이상 선택하세요!");

    setLoading(true);
    try {
      for (const [i, img] of selectedResults.entries()) {
        const imgSrc = getImageURL(img);
        if (!imgSrc) continue;

        const res = await fetch("/api/gif", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageBase64: imgSrc, loop }),
        });

        const data = await res.json();
        if (!data.success) continue;

        const blob = await fetch(data.gif).then((r) => r.blob());
        const file = new File([blob], `animated_${i + 1}.gif`, {
          type: "image/gif",
        });

        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: {
              file,
              thumbnail: data.gif,
              meta: { label: "GIF 변환" },
            },
          })
        );
      }

      alert(`✅ ${selectedResults.length}개의 GIF 변환 완료!`);
    } catch (err) {
      console.error("🚨 GIF 변환 오류:", err);
      alert("GIF 변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-row">
      <label>GIF 변환</label>

      <label style={{ marginLeft: "10px" }}>
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
        />{" "}
        반복 재생
      </label>

      <button
        className="btn"
        onClick={handleGifConvert}
        disabled={disabled || !hasSelected || loading}
      >
        {loading ? "GIF 변환 중..." : "GIF 변환 실행"}
      </button>
    </div>
  );
}
