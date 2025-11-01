import React, { useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import "./ProcessResult.css";

export default function ProcessResult({ results = [] }) {
  const [selectedResults, setSelectedResults] = useState([]);

  // ✅ 이미지 선택 / 해제
  const toggleSelect = (img) => {
    setSelectedResults((prev) =>
      prev.includes(img) ? prev.filter((i) => i !== img) : [...prev, img]
    );
  };

  const handleSelectAll = () => setSelectedResults([...results]);
  const handleDeselectAll = () => setSelectedResults([]);
  const handleDeleteAll = () => {
    if (window.confirm("모든 처리 이미지를 삭제하시겠습니까?")) {
      setSelectedResults([]);
    }
  };

  // ✅ 개별 저장
  const handleDownload = (base64, index) => {
    const link = document.createElement("a");
    link.href = `data:image/png;base64,${base64}`;
    link.download = `result_${index + 1}.png`;
    link.click();
  };

  // ✅ 전체 저장 (ZIP)
  const handleDownloadAll = async () => {
    if (results.length === 0) return alert("저장할 이미지가 없습니다!");
    const zip = new JSZip();

    results.forEach((base64, idx) => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
      zip.file(`result_${idx + 1}.png`, blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "elliesbang_results.zip");
  };

  return (
    <section className="section-box">
      <h2>🎉 처리 결과</h2>

      {/* ✅ 컨트롤 버튼 */}
      <div className="result-controls">
        <button onClick={handleSelectAll}>전체 선택</button>
        <button onClick={handleDeselectAll}>전체 해제</button>
        <button onClick={handleDeleteAll}>전체 삭제</button>
      </div>

      {/* ✅ 썸네일 */}
      <div className="result-grid">
        {results.length === 0 ? (
          <p className="empty">아직 처리된 이미지가 없습니다.</p>
        ) : (
          results.map((img, idx) => (
            <div
              key={idx}
              className={`result-thumb ${
                selectedResults.includes(img) ? "selected" : ""
              }`}
              onClick={() => toggleSelect(img)}
            >
              <img
                src={`data:image/png;base64,${img}`}
                alt={`결과 이미지 ${idx + 1}`}
                className="result-image"
              />
              <button
                className="save-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(img, idx);
                }}
              >
                저장
              </button>
            </div>
          ))
        )}
      </div>

      {results.length > 0 && (
        <div className="download-all-wrapper">
          <button className="download-all" onClick={handleDownloadAll}>
            전체 다운로드
          </button>
        </div>
      )}
    </section>
  );
}
