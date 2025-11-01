import React, { useState } from "react";
import "./ExtraEdit.css";

export default function ExtraEdit({ processedImages = [], setResults }) {
  const [selected, setSelected] = useState(null);
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [editedSvg, setEditedSvg] = useState(null);
  const [svgColor, setSvgColor] = useState("#ffd331");

  // ✅ 이미지 선택
  const handleSelect = (img) => {
    setSelected(img === selected ? null : img);
  };

  // ✅ API 호출
  const callApi = async (endpoint, payload) => {
    setLoading(true);
    setProgress(25);
    const res = await fetch(`/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setProgress(70);
    const data = await res.json();
    setProgress(100);
    setTimeout(() => setProgress(0), 800);
    setLoading(false);
    return data;
  };

  // ✅ 리사이즈
  const handleResize = async () => {
    if (!selected || !width) return alert("이미지와 가로 크기를 입력하세요.");
    const img = new Image();
    img.src = `data:image/png;base64,${selected}`;
    await new Promise((res) => (img.onload = res));

    const ratio = img.height / img.width;
    const newHeight = Math.round(Number(width) * ratio);
    setHeight(newHeight);

    const canvas = document.createElement("canvas");
    canvas.width = Number(width);
    canvas.height = newHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0, Number(width), newHeight);
    const resizedBase64 = canvas.toDataURL("image/png").split(",")[1];

    setResults((prev) => prev.map((r) => (r === selected ? resizedBase64 : r)));
    alert("리사이즈 완료! 선택된 이미지가 덮어쓰기 되었습니다.");
  };

  // ✅ PNG → SVG 변환
  const handleSvg = async () => {
    if (!selected) return alert("이미지를 선택하세요!");
    const res = await callApi("svg", { imageBase64: selected });
    if (res.svg) {
      setEditedSvg(res.svg);
      setResults((prev) => [...prev, btoa(res.svg)]);
      alert("SVG 변환 완료!");
    } else alert(res.error || "SVG 변환 실패");
  };

  // ✅ SVG 색상 변경
  const handleSvgColorChange = () => {
    if (!editedSvg) return;
    const updated = editedSvg.replace(/fill="[^"]*"/g, `fill="${svgColor}"`);
    setEditedSvg(updated);
  };

  // ✅ GIF 생성
  const handleGif = async () => {
    if (!selected) return alert("이미지를 선택하세요!");
    const res = await callApi("gif", { imageBase64: selected });
    if (res.result) setResults((prev) => [...prev, res.result]);
    else alert(res.error || "GIF 변환 실패");
  };

  // ✅ 키워드 분석
  const handleAnalyze = async () => {
    if (!processedImages.length) return alert("분석할 이미지가 없습니다!");
    const res = await callApi("analyze", { images: processedImages });
    if (res.common_keywords) setAnalyzeResult(res);
    else alert(res.error || "분석 실패");
  };

  const handleCopy = () => {
    if (!analyzeResult) return;
    const text = `
📌 제목: ${analyzeResult.title}
공통 키워드: ${analyzeResult.common_keywords.join(", ")}
개별 키워드:
${Object.entries(analyzeResult.individual_keywords)
  .map(([k, v]) => `${k}: ${v.join(", ")}`)
  .join("\n")}
`;
    navigator.clipboard.writeText(text);
    alert("분석 결과가 복사되었습니다!");
  };

  return (
    <section className="section-card">
      <h2 className="section-title">🧩 추가 편집</h2>

      {/* 로딩바 */}
      {loading && (
        <div className="progress-bar">
          <div className="progress" style={{ width: `${progress}%` }} />
        </div>
      )}

      {/* ✅ 썸네일 선택 */}
      <div className="thumb-grid">
        {processedImages.map((img, i) => (
          <div
            key={i}
            className={`thumb-box ${selected === img ? "selected" : ""}`}
            onClick={() => handleSelect(img)}
          >
            <img src={`data:image/png;base64,${img}`} alt={`결과 ${i}`} />
          </div>
        ))}
      </div>

      {/* 섹션 1️⃣ 리사이즈 */}
      <div className="edit-section">
        <h3>📏 리사이즈</h3>
        <p>가로 사이즈를 입력하면 세로는 자동 계산됩니다.</p>
        <input
          type="number"
          placeholder="가로 크기(px)"
          value={width}
          onChange={(e) => setWidth(e.target.value)}
        />
        <button onClick={handleResize}>리사이즈</button>
      </div>

      {/* 섹션 2️⃣ PNG → SVG */}
      <div className="edit-section">
        <h3>🖼️ PNG → SVG 변환</h3>
        <p>선택된 이미지를 편집 가능한 SVG로 변환합니다.</p>
        <button onClick={handleSvg}>SVG 변환</button>

        {editedSvg && (
          <div className="svg-preview">
            <h4>🎨 색상 편집</h4>
            <input
              type="color"
              value={svgColor}
              onChange={(e) => setSvgColor(e.target.value)}
            />
            <button onClick={handleSvgColorChange}>색상 변경 적용</button>
            <div
              className="svg-display"
              dangerouslySetInnerHTML={{ __html: editedSvg }}
            />
          </div>
        )}
      </div>

      {/* 섹션 3️⃣ GIF 생성 */}
      <div className="edit-section">
        <h3>✨ GIF 생성</h3>
        <p>선택된 이미지를 움직이는 느낌의 GIF로 변환합니다.</p>
        <button onClick={handleGif}>GIF 생성</button>
      </div>

      {/* 섹션 4️⃣ 키워드 분석 */}
      <div className="edit-section">
        <h3>🔍 키워드 분석</h3>
        <p>처리된 이미지들의 공통 및 개별 키워드를 분석합니다.</p>
        <button onClick={handleAnalyze}>키워드 분석</button>

        {analyzeResult && (
          <div className="analyze-result">
            <h4>📌 {analyzeResult.title}</h4>
            <p>
              <b>공통:</b> {analyzeResult.common_keywords.join(", ")}
            </p>
            <ul>
              {Object.entries(analyzeResult.individual_keywords).map(
                ([key, val]) => (
                  <li key={key}>
                    {key}: {val.join(", ")}
                  </li>
                )
              )}
            </ul>
            <button onClick={handleCopy}>복사</button>
          </div>
        )}
      </div>
    </section>
  );
}
