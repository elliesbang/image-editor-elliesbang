import React, { useState } from "react";

export default function KeywordAnalyzer({ selectedResults = [] }) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [keywords, setKeywords] = useState([]);

  const handleAnalyze = async () => {
    if (!selectedResults.length)
      return alert("이미지를 하나 이상 선택하세요!");

    setLoading(true);
    try {
      const imageBase64Array = await Promise.all(
        selectedResults.map(async (img) => {
          if (typeof img === "string") return img;
          if (img.src?.startsWith("data:image")) return img.src;
          const blob = await fetch(img.src).then((r) => r.blob());
          return await new Promise((res) => {
            const reader = new FileReader();
            reader.onloadend = () => res(reader.result);
            reader.readAsDataURL(blob);
          });
        })
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: imageBase64Array }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error);

      setTitle(data.title);
      setKeywords(data.keywords);
    } catch (err) {
      console.error("🚨 분석 오류:", err);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    alert(`${label} 복사 완료!`);
  };

  return (
    <div className="tool-row">
      <button className="btn" onClick={handleAnalyze} disabled={loading}>
        {loading ? "분석 중..." : "키워드 분석"}
      </button>

      {title && (
        <div className="analysis-result">
          <h3>
            제목{" "}
            <button
              className="copy-btn"
              onClick={() => copyToClipboard(title, "제목")}
            >
              📋
            </button>
          </h3>
          <p>{title}</p>

          <h3 style={{ marginTop: "10px" }}>
            키워드{" "}
            <button
              className="copy-btn"
              onClick={() =>
                copyToClipboard(keywords.join(", "), "키워드")
              }
            >
              📋
            </button>
          </h3>
          <div className="keyword-list">
            {keywords.map((k, i) => (
              <span key={i} className="keyword-tag">
                {k}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
