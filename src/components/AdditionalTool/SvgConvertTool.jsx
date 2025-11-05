import React, { useState } from "react";
import { getImageURL } from "../ImageEditor/utils";

export default function SvgConvertTool({
  selectedResults = [], // ✅ 처리결과 섹션에서 선택된 이미지들
  disabled,
}) {
  const [maxColors, setMaxColors] = useState(6);
  const [loading, setLoading] = useState(false);

  const hasSelected = Array.isArray(selectedResults) && selectedResults.length > 0;

  const handleSvgConvert = async () => {
    if (!hasSelected)
      return alert("⚠️ 처리결과 섹션에서 이미지를 하나 이상 선택하세요!");

    setLoading(true);

    try {
      for (const [i, img] of selectedResults.entries()) {
        const imgSrc = getImageURL(img);
        if (!imgSrc) continue;

        // ✅ 서버로 변환 요청
        const res = await fetch("/api/svg", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: imgSrc,
            maxColors,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          console.error("🚨 SVG 변환 실패:", data.error);
          continue;
        }

        // ✅ SVG Blob 생성
        const blob = new Blob([data.svg], { type: "image/svg+xml" });
        const file = new File([blob], `vector_${i + 1}.svg`, {
          type: "image/svg+xml",
        });

        // ✅ 처리결과로 전송
        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: {
              file,
              thumbnail: URL.createObjectURL(blob),
              meta: { label: `SVG(${maxColors}색)` },
            },
          })
        );
      }

      alert(`✅ ${selectedResults.length}개의 이미지 SVG 변환 완료!`);
    } catch (err) {
      console.error("🚨 SVG 변환 오류:", err);
      alert("SVG 변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-row">
      <label>SVG 색상수:</label>
      <select
        value={maxColors}
        onChange={(e) => setMaxColors(Number(e.target.value))}
        disabled={loading}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>
            {n}색
          </option>
        ))}
      </select>

      <button
        className="btn"
        onClick={handleSvgConvert}
        disabled={disabled || !hasSelected || loading}
      >
        {loading ? "SVG 변환 중..." : "SVG 변환 실행"}
      </button>
    </div>
  );
}
