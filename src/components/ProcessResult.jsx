import React, { useState } from "react";
import "./ProcessResult.css";

export default function ProcessResult() {
  const [images, setImages] = useState([
    // 예시용 데이터 (API 연결 전까지)
    { id: 1, src: "https://via.placeholder.com/150", selected: false },
    { id: 2, src: "https://via.placeholder.com/150", selected: false },
  ]);

  const toggleSelect = (id) => {
    setImages((prev) =>
      prev.map((img) =>
        img.id === id ? { ...img, selected: !img.selected } : img
      )
    );
  };

  const selectAll = () => setImages((prev) => prev.map((img) => ({ ...img, selected: true })));
  const deselectAll = () => setImages((prev) => prev.map((img) => ({ ...img, selected: false })));
  const deleteAll = () => setImages([]);

  const deleteOne = (id) => setImages((prev) => prev.filter((img) => img.id !== id));

  return (
    <section className="section-card">
      <h2 className="section-title">🖼 처리 결과</h2>

      <div className="result-controls">
        <button className="btn" onClick={selectAll}>전체 선택</button>
        <button className="btn" onClick={deselectAll}>전체 해제</button>
        <button className="btn" onClick={deleteAll}>전체 삭제</button>
      </div>

      <div className="result-grid">
        {images.length === 0 ? (
          <p className="empty-text">처리된 이미지가 없습니다.</p>
        ) : (
          images.map((img) => (
            <div
              key={img.id}
              className={`thumb ${img.selected ? "selected" : ""}`}
              onClick={() => toggleSelect(img.id)}
            >
              <img src={img.src} alt="result" />
              <button className="delete-btn" onClick={(e) => { e.stopPropagation(); deleteOne(img.id); }}>✕</button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
