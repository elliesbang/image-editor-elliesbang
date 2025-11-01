import React, { useState } from "react";
import "./App.css";

export default function App() {
  const [images, setImages] = useState([]);
  const [results, setResults] = useState([]);

  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const previews = files.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setImages(previews);
  };

  return (
    <div className="app-container">
      {/* ① 헤더 */}
      <header className="app-header">
        <div className="logo">💛 엘리의방 이미지 에디터</div>
        <div className="header-buttons">
          <button className="btn">로그인</button>
          <button className="btn upgrade">업그레이드</button>
        </div>
      </header>

      {/* ② 이미지 업로드 */}
      <section className="upload-section">
        <h2>이미지 업로드</h2>
        <div className="upload-box">
          <input
            type="file"
            id="imageUpload"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleUpload}
          />
          <label htmlFor="imageUpload" className="upload-label">
            📁 클릭 또는 드래그하여 업로드 (최대 50장)
          </label>
        </div>
        <div className="thumbnail-container">
          {images.map((img, idx) => (
            <div key={idx} className="thumb">
              <img src={img.url} alt={img.name} />
            </div>
          ))}
        </div>
      </section>

      {/* ③ 이미지 편집 */}
      <section className="edit-section">
        <h2>이미지 편집</h2>
        <div className="edit-buttons">
          <button className="btn-action">배경제거</button>
          <button className="btn-action">크롭</button>
          <button className="btn-action">배경제거+크롭</button>
          <button className="btn-action">노이즈 제거</button>
        </div>
      </section>

      {/* ④ 처리 결과 */}
      <section className="result-section">
        <h2>처리 결과</h2>
        <div className="result-buttons">
          <button className="btn">전체삭제</button>
          <button className="btn">전체해제</button>
          <button className="btn upgrade">전체다운</button>
        </div>
        <div className="thumbnail-container">
          {results.length === 0 ? (
            <p className="empty">아직 처리된 이미지가 없습니다.</p>
          ) : (
            results.map((r, idx) => (
              <div key={idx} className="thumb result">
                <img src={r.url} alt={"result-" + idx} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ⑤ 추가 편집 */}
      <section className="extra-section">
        <h2>추가 편집</h2>
        <div className="edit-buttons">
          <button className="btn-action">리사이즈</button>
          <button className="btn-action">SVG 변환</button>
          <button className="btn-action">GIF 생성</button>
          <button className="btn-action">키워드 분석</button>
        </div>
      </section>

      {/* ⑥ 푸터 */}
      <footer className="footer">
        <p>
          <a href="#">이용약관</a> | <a href="#">쿠키정책</a> |{" "}
          <a href="#">개인정보처리방침</a>
        </p>
        <p className="copy">© 2025 엘리의방. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
