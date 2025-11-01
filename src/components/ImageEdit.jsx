import React, { useState } from "react";
import "./ImageEdit.css";

export default function ImageEdit({ uploadedImages = [], setResults }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 이미지 선택 토글
  const toggleSelect = (img) => {
    setSelectedImages((prev) =>
      prev.includes(img)
        ? prev.filter((i) => i !== img)
        : [...prev, img]
    );
  };

  // ✅ 전체 선택 / 해제
  const handleSelectAll = () => {
    setSelectedImages([...uploadedImages]);
  };

  const handleDeselectAll = () => {
    setSelectedImages([]);
  };

  const handleDeleteAll = () => {
    if (window.confirm("선택된 이미지를 모두 삭제하시겠습니까?")) {
      setSelectedImages([]);
    }
  };

  // ✅ 공통 API 호출 함수
  const processImage = async (endpoint, img) => {
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: img }),
      });
      const data = await res.json();
      if (data.image_base64) return data.image_base64;
      if (data.data?.[0]?.b64_json) return data.data[0].b64_json;
      return null;
    } catch (err) {
      console.error(`${endpoint} 처리 오류:`, err);
      return null;
    }
  };

  // ✅ 처리 버튼들
  const handleRemoveBg = async () => {
    if (!selectedImages.length) return alert("이미지를 선택해주세요!");
    setLoading(true);
    const newResults = [];

    for (const img of selectedImages) {
      const result = await processImage("/api/remove-bg", img);
      if (result) newResults.push(result);
    }

    setResults((prev) => [...prev, ...newResults]);
    setLoading(false);
  };

  const handleCrop = async () => {
    if (!selectedImages.length) return alert("이미지를 선택해주세요!");
    setLoading(true);
    const newResults = [];

    for (const img of selectedImages) {
      const result = await processImage("/api/crop", img);
      if (result) newResults.push(result);
    }

    setResults((prev) => [...prev, ...newResults]);
    setLoading(false);
  };

  const handleRemoveBgCrop = async () => {
    if (!selectedImages.length) return alert("이미지를 선택해주세요!");
    setLoading(true);
    const newResults = [];

    for (const img of selectedImages) {
      const result = await processImage("/api/remove-bg-crop", img);
      if (result) newResults.push(result);
    }

    setResults((prev) => [...prev, ...newResults]);
    setLoading(false);
  };

  const handleDenoise = async () => {
    if (!selectedImages.length) return alert("이미지를 선택해주세요!");
    setLoading(true);
    const newResults = [];

    for (const img of selectedImages) {
      const result = await processImage("/api/denoise", img);
      if (result) newResults.push(result);
    }

    setResults((prev) => [...prev, ...newResults]);
    setLoading(false);
  };

  return (
    <section className="section-box">
      <h2>🧩 이미지 편집</h2>

      {loading && <p className="loading">이미지 처리 중입니다...</p>}

      <div className="edit-controls">
        <button onClick={handleSelectAll}>전체 선택</button>
        <button onClick={handleDeselectAll}>전체 해제</button>
        <button onClick={handleDeleteAll}>전체 삭제</button>
      </div>

      <div className="action-buttons">
        <button onClick={handleRemoveBg}>배경 제거</button>
        <button onClick={handleCrop}>크롭</button>
        <button onClick={handleRemoveBgCrop}>배경 제거 + 크롭</button>
        <button onClick={handleDenoise}>노이즈 제거</button>
      </div>

      <div className="thumbnail-grid">
        {uploadedImages.map((img, idx) => (
          <div
            key={idx}
            className={`thumb-wrapper ${
              selectedImages.includes(img) ? "selected" : ""
            }`}
            onClick={() => toggleSelect(img)}
          >
            <img
              src={`data:image/png;base64,${img}`}
              alt={`업로드된 이미지 ${idx + 1}`}
              className="thumb-image"
            />
            {selectedImages.includes(img) && (
              <div className="thumb-overlay">✔</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
