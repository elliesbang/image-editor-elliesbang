import React, { useState } from "react";

export default function AdditionalEditor({ selectedImage }) {
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);

  const analyzeKeywords = async () => {
    if (!selectedImage) return alert("이미지를 선택하세요!");
    setLoading(true);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (data.success && data.keywords?.length > 0) {
        setKeywords(data.keywords);
      } else {
        alert("키워드 분석 결과가 없습니다.");
      }
    } catch (err) {
      alert("키워드 분석 중 오류가 발생했습니다.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (keywords.length === 0) return;
    navigator.clipboard.writeText(keywords.join(", "));
    alert("키워드가 복사되었습니다 ✅");
  };

  return (
    <div className="additional-editor">
      <h3>🧠 키워드 분석</h3>

      <button
        onClick={analyzeKeywords}
        disabled={loading}
        className="analyze-btn"
      >
        {loading ? "분석 중..." : "키워드 분석하기"}
      </button>

      {keywords.length > 0 && (
        <div className="keyword-result">
          <div className="keyword-header">
            <h4>📋 분석 결과</h4>
            <button onClick={copyToClipboard} className="copy-btn">
              복사
            </button>
          </div>

          <ul className="keyword-list">
            {keywords.map((kw, i) => (
              <li key={i}># {kw}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}