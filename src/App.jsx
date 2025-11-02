import React, { useState } from "react";
import Header from "./components/Header";
import ImageUpload from "./components/ImageUpload";
import ImageEditor from "./components/ImageEditor";
import ProcessResult from "./components/ProcessResult";
import AdditionalEditor from "./components/AdditionalEditor";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagesUploaded = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  return (
    <div className="app-layout">
      {/* ✅ 헤더 */}
      <Header />

      <main className="app-main">
        {/* ✅ 이미지 업로드 섹션 */}
        <section className="app-section">
          <ImageUpload
            onImagesUploaded={handleImagesUploaded}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        {/* ✅ 이미지 편집 섹션 */}
        <section className="app-section">
          <ImageEditor selectedImage={selectedImage} />
        </section>

        {/* ✅ 처리 결과 섹션 */}
        <section className="app-section">
          <ProcessResult
            images={images}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        {/* ✅ 추가 기능 섹션 */}
        <section className="app-section">
          <AdditionalEditor selectedImage={selectedImage} />
        </section>
      </main>

      {/* ✅ 푸터 */}
      <Footer />
    </div>
  );
}

export default App;
