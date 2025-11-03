import React, { useState } from "react";
import Header from "./components/Header";
import Footer from "./components/Footer";
import LoginModal from "./components/LoginModal";
import Layout from "./components/Layout"; // ✅ 섹션 조립 전용

import "./App.css";

export default function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [loginOpen, setLoginOpen] = useState(false);

  const sharedProps = {
    images,
    setImages,
    selectedImage,
    setSelectedImage,
    selectedImages,
    setSelectedImages,
    selectedResult,
    setSelectedResult,
  };

  return (
    <div className="app-layout">
      <Header onLoginClick={() => setLoginOpen(true)} />
      <Layout {...sharedProps} /> {/* ✅ 모든 섹션 렌더링 */}
      <Footer />

      {loginOpen && <LoginModal onClose={() => setLoginOpen(false)} />}
    </div>
  );
}
