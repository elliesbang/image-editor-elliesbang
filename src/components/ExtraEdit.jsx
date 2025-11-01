import React from "react";
import "./ExtraEdit.css";

export default function ExtraEdit() {
  return (
    <section className="section-card">
      <h2 className="section-title">✨ 추가 편집</h2>

      <div className="extra-grid">
        <button className="extra-btn">
          리사이즈<br /><span>크기 조정하기</span>
        </button>
        <button className="extra-btn">
          SVG 변환<br /><span>벡터로 저장</span>
        </button>
        <button className="extra-btn">
          GIF 변환<br /><span>움직이는 이미지</span>
        </button>
        <button className="extra-btn">
          키워드 분석<br /><span>AI 자동 추출</span>
        </button>
      </div>

      <p className="extra-note">💡 모든 추가 편집 기능은 곧 자동화 API로 연결됩니다.</p>
    </section>
  );
}
