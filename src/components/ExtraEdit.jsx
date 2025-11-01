import React, { useState } from "react";
import "./ExtraEdit.css";

export default function ExtraEdit({ processedImages = [], setResults }) {
  const [selected, setSelected] = useState(null);

  // 리사이즈 상태
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [originalRatio, setOriginalRatio] = useState(1);

  // SVG 상태
  const [svgColors, setSvgColors] = useState(3);
  const [color, setColor] = useState("#ffd331");
  const [svgProgress, setSvgProgress] = useState(0);
  const [svgLoading, setSvgLoading] = useState(false);

  // 키워드 분석 상태
  const [keywords, setKeywords] = useState([]);
  const [title, setTitle] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  // 이미지 선택
  const selectImage = (img) => {
    setSelected(img);
    const imgObj = new Image();
    imgObj.src = `data:image/png;base64,${img}`;
    imgObj.onload = () => setOriginalRatio(imgObj.height / imgObj.width);
  };

  // ✅ 리사이즈
  const handleResize = async () => {
    if (!selected || !width) return alert("이미지와 가로 크기를 입력하세요.");
    const newHeight = Math.round(Number(width) * originalRatio);
    setHeight(newHeight);

    const res = await fetch("/api/resize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: selected, width, height: newHeight }),
    });
    const data = await res.json();
    if (data.result) {
      setResults((prev) =>
        prev.map((r) => (r === selected ? data.result : r))
      );
      alert("리사이즈 완료! 선택된 이미지가 덮어쓰기 되었습니다.");
    }
  };

  // ✅ SVG 변환
  const convertToSVG = async () => {
    if (!selected) return alert("이미지를 선택하세요.");
    setSvgLoading(true);
    setSvgProgress(0);

    const interval = setInterval(() => {
      setSvgProgress((p) => (p >= 100 ? 100 : p + 10));
    }, 300);

    try {
      const res = await fetch("/api/svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: selected,
          colorCount: svgColors,
          color,
        }),
      });
      const data = await res.json();
      clearInterval(interval);
      setSvgProgress(100);
      if (data.result) {
        setResults((prev) => [...prev, data.result]);
        alert("SVG 변환 완료!");
      } else alert(data.error || "SVG 변환 실패");
    } catch (e) {
      console.error(e);
      alert("SVG 변환 오류 발생");
    } finally {
      setSvgLoading(false);
    }
  };

  // ✅ GIF 변환
  const convertToGIF = async () => {
    if (!selected) return alert("이미지를 선택하세요.");
    const res = await fetch("/api/gif", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: selected }),
    });
    const data = await res.json();
    if (data.result) setResults((prev) => [...prev, data.result]);
  };

  // ✅ 키워드 분석
  const analyzeKeywords = async () => {
    if (!selected) return alert("이미지를 선택하세요.");
    setAnalyzing(true);
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: selected }),
    });
    const data = await res.json();
    if (data.keywords) {
      setKeywords(data.keywords);
      setTitle(data.title);
    }
    setAnalyzing(false);
  };

  const copyKeywords = () => {
    navigator.clipboard.writeText(`${title}\n${keywords.join(", ")}`);
    alert("키워드와 제목이 복사되었습니다!");
  };

  return (
    <section className="extra-container">
      <h2 className="section-title">⚙️ 추가 기능</h2>

      {/* 썸네일 선택 */}
      <div className="thumbnail-row">
        {processedImages.map((img, idx) => (
          <div
            key={idx}
            className={`thumb-wrapper ${selected === img ? "selected" : ""}`}
            onClick={() => selectImage(img)}
          >
            <img src={`data:image/png;base64,${img}`} alt={`img-${idx}`} />
          </div>
        ))}
      </div>

      {/* 상단 두 개 */}
      <div className="extra-row">
        {/* 리사이즈 */}
        <div className="extra-box">
          <h3>📏 리사이즈</h3>
          <label>
            가로(px):
            <input
              type="number"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="예: 800"
            />
          </label>
          <p>세로: {height || "자동 계산됨"}</p>
          <button onClick={handleResize} className="extra-btn">
            🔄 리사이즈
          </button>
        </div>

        {/* PNG → SVG */}
        <div className="extra-box">
          <h3>🎨 PNG → SVG</h3>
          <label>
            색상 수 (1~6):
            <input
              type="number"
              min="1"
              max="6"
              value={svgColors}
              onChange={(e) => setSvgColors(e.target.value)}
            />
          </label>
          <label>
            대표 색상:
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </label>
          <button onClick={convertToSVG} className="extra-btn">
            🖼️ SVG 변환
          </button>
          {svgLoading && (
            <div className="progress-bar">
              <div style={{ width: `${svgProgress}%` }}></div>
            </div>
          )}
        </div>
      </div>

      {/* 하단 두 개 */}
      <div className="extra-row">
        {/* GIF */}
        <div className="extra-box gif-box">
          <h3>🎞️ GIF 스타일 변환</h3>
          <p className="desc">
            선택된 이미지를 부드러운 잔상과 빛효과가 있는 GIF 스타일로 바꿉니다.
          </p>
          <button onClick={convertToGIF} className="extra-btn">
            ✨ GIF 변환
          </button>
        </div>

        {/* 키워드 분석 */}
        <div className="extra-box keyword-box">
          <h3>🧠 키워드 분석</h3>
          <button
            onClick={analyzeKeywords}
            disabled={analyzing}
            className="extra-btn"
          >
            {analyzing ? "분석 중..." : "🔍 분석 시작"}
          </button>
          {keywords.length > 0 && (
            <div className="keyword-results">
              <p>
                <strong>제목:</strong> {title}
              </p>
              <p>
                <strong>키워드:</strong> {keywords.join(", ")}
              </p>
              <button onClick={copyKeywords} className="copy-btn">
                📋 복사
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
