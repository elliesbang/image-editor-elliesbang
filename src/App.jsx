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
      }}
    >
      {/* ✅ 헤더 */}
      <Header />

      {/* ✅ 메인 콘텐츠 */}
      <main
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          maxWidth: "1000px",
          padding: "40px 20px",
          gap: "40px",
        }}
      >
        {/* 1️⃣ 이미지 업로드 섹션 */}
        <ImageUpload />

        {/* 2️⃣ 이미지 편집 섹션 */}
        <ImageEdit />

        {/* 3️⃣ 처리결과 섹션 */}
        <ProcessResult />

        {/* 4️⃣ 추가 편집 섹션 */}
        <ExtraEdit />
      </main>

      {/* ✅ 푸터 */}
      <Footer />
    </div>
  );
}
