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
  const [desc, setDesc] = useState("");

  const activeImage = selectedResultImage || selectedUploadImage || selectedImage || (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  const handleAnalyze = async () => {
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const blob =
        currentImage instanceof File
          ? currentImage
          : await fetch(currentImage.startsWith("data:image") ? currentImage : `data:image/png;base64,${currentImage}`).then((r) => r.blob());

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
        setDesc(data.description || "");
      } else throw new Error("분석 실패");
    } catch (err) {
      console.error("분석 오류:", err);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyKeywords = () => {
    if (!keywords.length) return;
    navigator.clipboard.writeText(keywords.join(", "));
    alert("키워드가 복사되었습니다 ✅");
  };

  return (
    <div className="tool-block">
      <label>키워드 분석</label>
      <button className="btn" onClick={handleAnalyze} disabled={loading || !hasActiveImage}>
        {loading ? "분석 중..." : "키워드 분석"}
      </button>

      {keywords.length > 0 && (
        <div className="keyword-result">
          <h4>{title}</h4>
          <p>{keywords.join(", ")}</p>
          <small>{desc}</small>
          <button className="copy-btn" onClick={copyKeywords}>
            복사
          </button>
        </div>
      )}
    </div>
  );
}
