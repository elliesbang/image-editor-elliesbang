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
  const [selectedResult, setSelectedResult] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  // ✅ 업로드 시 첫 이미지를 자동 선택
  const handleImagesUploaded = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setSelectedImage(newImages[0]);
    }
  };

  return (
    <div className="app-layout">
      <Header onLoginClick={() => setLoginOpen(true)} />

      <main className="app-main">
        {/* 이미지 업로드 */}
        <section className="app-section">
          <div className="section-header">📁 이미지 업로드</div>
          <ImageUpload
            onImagesUploaded={handleImagesUploaded}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        {/* 이미지 편집 */}
        <section className="app-section">
          <div className="section-header">🎨 이미지 편집</div>
          <ImageEditor
            selectedImage={selectedImage}
            onProcessComplete={(resultImage) => setSelectedResult(resultImage)} // ✅ 추가
          />
        </section>

        {/* 처리 결과 */}
        <section className="app-section">
          <div className="section-header">🎉 처리 결과</div>
          <ProcessResult
            images={images}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            selectedResult={selectedResult} // ✅ 전달
            setSelectedResult={setSelectedResult}
          />
        </section>

        {/* 추가 기능 */}
        <section className="app-section">
          <div className="section-header">⚙️ 추가 기능</div>
          <AdditionalEditor
            selectedUploadImage={selectedImage}
            selectedResultImage={selectedResult}
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
