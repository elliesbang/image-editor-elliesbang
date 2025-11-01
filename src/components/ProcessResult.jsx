import React from "react";
import "./ProcessResult.css";

export default function ProcessResult({ results = [] }) {
  if (results.length === 0) {
    return <p className="no-result">아직 처리된 이미지가 없습니다.</p>;
  }

  return (
    <section className="section-box">
      <h2>📦 처리 결과</h2>

      <div className="result-controls">
        <button>전체 선택</button>
        <button>전체 해제</button>
        <button>전체 삭제</button>
      </div>

      <div className="result-grid">
        {results.map((item, index) => (
          <div key={index} className="result-item">
            <img
              src={
                item.startsWith("data:image")
                  ? item
                  : `data:image/png;base64,${item}`
              }
              alt={`결과 이미지 ${index + 1}`}
              className="result-thumb"
            />
            <div className="result-meta">
              <button>다운로드</button>
              <button>삭제</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
