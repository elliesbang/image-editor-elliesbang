import React, { useState } from "react";

const Analyzer = ({ selectedImage }) => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!selectedImage) {
      alert("이미지를 선택하세요!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("image", selectedImage.file);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch {
      alert("분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analyzer-section">
      <button onClick={handleAnalyze} disabled={loading}>
        {loading ? "분석 중..." : "키워드 분석"}
      </button>

      {result && (
        <div className="analyze-result">
          <h4>분석 결과</h4>
          <p>{result.keywords || "키워드를 찾을 수 없습니다."}</p>
        </div>
      )}
    </div>
  );
};

export default Analyzer;
