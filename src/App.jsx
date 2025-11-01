import React from "react";
import Header from "./components/Header";
import ImageUpload from "./components/ImageUpload";
import ImageEdit from "./components/ImageEdit";
import ProcessResult from "./components/ProcessResult";
import ExtraEdit from "./components/ExtraEdit";
import Footer from "./components/Footer";
import "./App.css";

export default function App() {
  return (
    <div className="app-layout">
      {/* ✅ 헤더 */}
      <Header />

      {/* ✅ 메인 컨텐츠 */}
      <main className="app-main">
        {/* 1️⃣ 이미지 업로드 */}
        <section className="app-section">
          <ImageUpload />
        </section>

        {/* 2️⃣ 이미지 편집 */}
        <section className="app-section">
          <ImageEdit />
        </section>

        {/* 3️⃣ 처리 결과 */}
        <section className="app-section">
          <ProcessResult />
        </section>

        {/* 4️⃣ 추가 편집 */}
        <section className="app-section">
          <ExtraEdit />
        </section>
      </main>

      {/* ✅ 푸터 */}
      <Footer />
    </div>
  );
}
