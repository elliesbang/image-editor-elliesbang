import React from "react";
import Header from "./components/Header";
import ImageUpload from "./components/ImageUpload";
import ImageEdit from "./components/ImageEdit";
import ImageResult from "./components/ImageResult";
import ImageExtraTools from "./components/ImageExtraTools";
import "./App.css";

export default function App() {
  return (
    <div className="app-container">
      <Header />

      <section id="upload">
        <div className="section-inner">
          <h2 className="section-title">이미지 업로드</h2>
          <ImageUpload />
        </div>
      </section>

      <section id="edit">
        <div className="section-inner">
          <h2 className="section-title">이미지 편집</h2>
          <ImageEdit />
        </div>
      </section>

      <section id="result">
        <div className="section-inner">
          <h2 className="section-title">처리 결과</h2>
          <ImageResult />
        </div>
      </section>

      <section id="extra">
        <div className="section-inner">
          <h2 className="section-title">추가 편집</h2>
          <ImageExtraTools />
        </div>
      </section>
    </div>
  );
}
