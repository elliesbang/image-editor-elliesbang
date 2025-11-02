import React, { useState } from "react";
import Header from "./components/Header";
import ImageUpload from "./components/ImageUpload";
import ImageEditor from "./components/ImageEditor";
import ProcessResult from "./components/ProcessResult";
import AdditionalEditor from "./components/AdditionalEditor";
import LoginModal from "./components/LoginModal";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleImagesUploaded = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  return (
    <div className="app-layout">
      <Header onLoginClick={() => setLoginOpen(true)} />

      <main className="app-main">
        <section className="app-section">
          <div className="section-header">📁 이미지 업로드</div>
          <ImageUpload
            onImagesUploaded={handleImagesUploaded}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        <section className="app-section">
          <div className="section-header">🎨 이미지 편집</div>
          <ImageEditor selectedImage={selectedImage} />
        </section>

        <section className="app-section">
          <div className="section-header">🎉 처리 결과</div>
          <ProcessResult
            images={images}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        <section className="app-section">
          <div className="section-header">⚙️ 추가 기능</div>
          <AdditionalEditor
  selectedUploadImage={selectedImage}           // 업로드 쪽 선택
  selectedResultImage={selectedResult}          // 처리 결과 쪽 선택
/>
        </section>
      </main>

      <Footer />

      {/* 로그인 모달 */}
      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  );
}

export default App;
