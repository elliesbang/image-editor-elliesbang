import React, { useState } from "react";
import "./ProcessResult.css";

export default function ProcessResult({ results = [], setResults }) {
  const [selected, setSelected] = useState([]);

  // ✅ 전체 선택
  const handleSelectAll = () => {
    setSelected(results.map((_, i) => i));
  };

  // ✅ 전체 해제
  const handleDeselectAll = () => {
    setSelected([]);
  };

  // ✅ 전체 삭제
  const handleDeleteAll = () => {
    if (window.confirm("정말 모든 이미지를 삭제하시겠어요?")) {
      setResults([]);
      setSelected([]);
    }
  };

  // ✅ 개별 선택 toggle
  const toggleSelect = (index) => {
    setSelected((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  // ✅ 개별 삭제
  const handleDelete = (e, index) => {
    e.stopPropagation();
    const updated = results.filter((_, i) => i !== index);
    setResults(updated);
    setSelected((prev) => prev.filter((i) => i !== index));
  };

  // ✅ 개별 저장
  const handleDownload = (e, img, index) => {
    e.stopPropagation();
    const a = document.createElement("a");
    a.href = `data:image/png;base64,${img}`;
    a.download = `result_${index + 1}.png`;
    a.click();
  };

  // ✅ 전체 저장
  const handleDownloadAll = () => {
    results.forEach((img, index) => {
      const a = document.createElement("a");
      a.href = `data:image/png;base64,${img}`;
      a.download = `result_${index + 1}.png`;
      a.click();
    });
  };

  if (!results.length) {
    return (
      <section className="section-box">
        <h2>📦 처리 결과</h2>
        <p className="no-result">아직 처리된 이미지가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="section-box">
      <h2>📦 처리 결과</h2>

      <div className="result-controls">
        <button onClick={handleSelectAll}>전체 선택</button>
        <button onClick={handleDeselectAll}>전체 해제</button>
        <button onClick={handleDeleteAll}>전체 삭제</button>
        <button onClick={handleDownloadAll}>전체 저장</button>
      </div>

      <div className="result-grid">
        {results.map((img, index) => (
          <div
            key={index}
            className={`result-item ${
              selected.includes(index) ? "selected" : ""
            }`}
            onClick={() => toggleSelect(index)}
          >
            <img
              src={`data:image/png;base64,${img}`}
              alt={`결과 이미지 ${index + 1}`}
              className="result-thumb"
            />
            <div className="result-meta">
              <button onClick={(e) => handleDownload(e, img, index)}>
                개별 저장
              </button>
              <button onClick={(e) => handleDelete(e, index)}>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
