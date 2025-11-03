import React, { useState } from "react";
import { getCurrentImage, blobToBase64 } from "./utils";

export default function KeywordAnalyzeTool({
  selectedImage,
  selectedImages,
  selectedUploadImage,
  selectedResultImage,
}) {
  const [loading, setLoading] = useState(false);
  const [commonKeywords, setCommonKeywords] = useState([]);
  const [imageResults, setImageResults] = useState([]);

  const activeImages =
    (Array.isArray(selectedImages) && selectedImages.length > 0 && selectedImages) ||
    [selectedResultImage || selectedUploadImage || selectedImage].filter(Boolean);
  const hasActiveImage = activeImages.length > 0;

  const handleAnalyze = async () => {
    if (!hasActiveImage) return alert("이미지를 하나 이상 선택하세요!");
    setLoading(true);

    try {
      // ✅ 여러 이미지 base64로 변환
      const base64List = [];
      for (const img of activeImages) {
        const blob =
          img instanceof File
            ? img
            : await fetch(
                img.startsWith("data:image")
                  ? img
                  : `data:image/png;base64,${img}`
              ).then((r) => r.blob());
        const base64 = await blobToBase64(blob);
        base64List.push(base64.replace(/^data:image\/(png|jpeg);base64,/, ""));
      }

      // ✅ API 요청
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64List: base64List }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "분석 실패");

      // ✅ 결과 반영
      setCommonKeywords(data.common_keywords || []);
      setImageResults(data.images || []);
    } catch (err) {
      console.error("분석 오류:", err);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 복사 기능
  const copyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${label}이 복사되었습니다 ✅`);
  };

  return (
    <div className="tool-block">
      <label>키워드 분석</label>
      <button
        className="btn"
        onClick={handleAnalyze}
        disabled={loading || !hasActiveImage}
      >
        {loading ? "분석 중..." : "키워드 분석"}
      </button>

      {/* ✅ 공통 키워드 */}
      {commonKeywords.length > 0 && (
        <div className="keyword-result">
          <h4>공통 키워드</h4>
          <p>{commonKeywords.join(", ")}</p>
          <button
            className="copy-btn"
            onClick={() =>
              copyText(commonKeywords.join(", "), "공통 키워드")
            }
          >
            📋
          </button>
        </div>
      )}

      {/* ✅ 각 이미지별 결과 */}
      {imageResults.map((img, idx) => (
        <div key={idx} className="keyword-result">
          <h4>이미지 {img.index || idx + 1}</h4>
          <p>{img.keywords?.join(", ")}</p>
          <button
            className="copy-btn"
            onClick={() =>
              copyText(img.keywords?.join(", ") || "", `이미지 ${idx + 1} 키워드`)
            }
          >
            📋
          </button>
          {img.summary && <small>{img.summary}</small>}
        </div>
      ))}
    </div>
  );
}
