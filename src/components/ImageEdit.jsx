import React from "react";
import "./ImageEdit.css";

export default function ImageEdit() {
  return (
    <section className="image-edit-section">
      <h2 className="section-title">🪄 이미지 편집</h2>

      <div className="edit-buttons">
        <button className="edit-btn">배경제거</button>
        <button className="edit-btn">크롭</button>
        <button className="edit-btn">배경제거 + 크롭</button>
        <button className="edit-btn">노이즈 제거</button>
      </div>

      <div className="edit-note">
        <p>📌 각 버튼은 이미지 편집 API와 연결됩니다.</p>
      </div>
    </section>
  );
}
