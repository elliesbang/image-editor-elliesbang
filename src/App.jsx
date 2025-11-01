import React from "react";
import Header from "./components/Header";
import ImageUpload from "./components/ImageUpload";
import ImageEdit from "./components/ImageEdit";
import ProcessResult from "./components/ProcessResult";
import ExtraEdit from "./components/ExtraEdit";
import Footer from "./components/Footer";

export default function App() {
  return (
    <div
      style={{
        backgroundColor: "#fffef6",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      {/* ✅ 헤더 */}
      <Header />

      {/* ✅ 메인 컨텐츠 */}
      <main
        style={{
          width: "100%",
          maxWidth: "1000px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "40px",
          padding: "40px 20px",
          boxSizing: "border-box",
        }}
      >
        {/* 1️⃣ 이미지 업로드 */}
        <section
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "40px",
            width: "100%",
          }}
        >
          <ImageUpload />
        </section>

        {/* 2️⃣ 이미지 편집 */}
        <section
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "40px",
            width: "100%",
          }}
        >
          <ImageEdit />
        </section>

        {/* 3️⃣ 처리 결과 */}
        <section
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "40px",
            width: "100%",
          }}
        >
          <ProcessResult />
        </section>

        {/* 4️⃣ 추가 편집 */}
        <section
          style={{
            background: "#fff",
            borderRadius: "16px",
            boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
            padding: "40px",
            width: "100%",
          }}
        >
          <ExtraEdit />
        </section>
      </main>

      {/* ✅ 푸터 */}
      <Footer />
    </div>
  );
}
