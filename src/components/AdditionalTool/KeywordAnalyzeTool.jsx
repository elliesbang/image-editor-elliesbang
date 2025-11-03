import React, { useState } from "react";
import { getCurrentImage, blobToBase64 } from "./utils";

export default function KeywordAnalyzeTool({
  selectedImage,
  selectedImages,
  selectedUploadImage,
  selectedResultImage,
}) {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");

  const activeImage =
    selectedResultImage ||
    selectedUploadImage ||
    selectedImage ||
    (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  // ✅ 키워드 분석
  const handleAnalyze = async () => {
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const blob =
        currentImage instanceof File
          ? currentImage
          : await fetch(
              currentImage.startsWith("data:image")
                ? currentImage
                : `data:image/png;base64,${currentImage}`
            ).then((r) => r.blob());

      const base64 = await blobToBase64(blob);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (data.success) {
        setKeywords(data.keywords || []);
        setTitle(data.title || "분석 결과");
      } else throw new Error("분석 실패");
    } catch (err) {
      console.error("분석 오류:", err);
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

      {keywords.length > 0 && (
        <div className="keyword-result">
          {/* 🔹 제목 */}
          <div className="result-line">
            <strong>제목:</strong>
            <span>{title}</span>
            <button
              className="copy-btn"
              title="제목 복사"
              onClick={() => copyText(title, "제목")}
            >
              📋
            </button>
          </div>

          {/* 🔹 키워드 */}
          <div className="result-line">
            <strong>키워드:</strong>
            <span>{keywords.join(", ")}</span>
            <button
              className="copy-btn"
              title="키워드 복사"
              onClick={() => copyText(keywords.join(", "), "키워드")}
            >
              📋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
