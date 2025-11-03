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
  const [imageResults, setImageResults] = useState([]); // 개별 이미지 결과

  const activeImages =
    (Array.isArray(selectedImages) && selectedImages.length > 0
      ? selectedImages
      : [selectedResultImage || selectedUploadImage || selectedImage].filter(Boolean));

  const hasActiveImage = activeImages.length > 0;

  // ✅ 여러 이미지 키워드 분석
  const handleAnalyze = async () => {
    if (!hasActiveImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      // ✅ 여러 이미지 base64 배열 변환
      const base64List = await Promise.all(
        activeImages.map(async (img) => {
          const currentImage = getCurrentImage(img);
          const blob =
            currentImage instanceof File
              ? currentImage
              : await fetch(
                  currentImage.startsWith("data:image")
                    ? currentImage
                    : `data:image/png;base64,${currentImage}`
                ).then((r) => r.blob());
          return await blobToBase64(blob);
        })
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64List }),
      });

      const data = await res.json();
      if (data.success) {
        setCommonKeywords(data.common_keywords || []);
        setImageResults(data.images || []);
      } else throw new Error("분석 실패");
    } catch (err) {
      console.error("🚨 분석 오류:", err);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 복사 기능
  const copyText = (text, type) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${type}이(가) 복사되었습니다 ✅`);
  };

  return (
    <div className="tool-block">
      <label>키워드 분석</label>
      <button className="btn" onClick={handleAnalyze} disabled={loading || !hasActiveImage}>
        {loading ? "분석 중..." : "키워드 분석"}
      </button>

      {/* ✅ 공통 키워드 */}
      {commonKeywords.length > 0 && (
        <div className="keyword-result">
          <div className="result-line">
            <strong>공통 키워드:</strong>
            <span>{commonKeywords.join(", ")}</span>
            <button
              className="copy-btn"
              title="공통 키워드 복사"
              onClick={() => copyText(commonKeywords.join(", "), "공통 키워드")}
            >
              📋
            </button>
          </div>
        </div>
      )}

      {/* ✅ 개별 이미지 결과 */}
      {imageResults.length > 0 && (
        <div className="multi-results">
          {imageResults.map((res, i) => (
            <div key={i} className="keyword-result" style={{ marginTop: "12px" }}>
              <div className="result-line">
                <strong>제목 {i + 1}:</strong>
                <span>{res.title}</span>
                <button
                  className="copy-btn"
                  title="제목 복사"
                  onClick={() => copyText(res.title, `제목 ${i + 1}`)}
                >
                  📋
                </button>
              </div>

              <div className="result-line">
                <strong>키워드:</strong>
                <span>{res.keywords.join(", ")}</span>
                <button
                  className="copy-btn"
                  title="키워드 복사"
                  onClick={() =>
                    copyText(res.keywords.join(", "), `키워드 ${i + 1}`)
                  }
                >
                  📋
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
