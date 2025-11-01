import React, { useState } from "react";
import "./ImageUpload.css";

export default function ImageUpload() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);

  // ✅ 이미지 업로드
  const handleUpload = (e) => {
    const files = Array.from(e.target.files);
    const newImages = files.map((file) => ({
      id: URL.createObjectURL(file),
      file,
    }));
    setImages((prev) => [...prev, ...newImages]);

    const readers = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result;
            if (typeof result === "string") {
              const base64 = result.includes(",")
                ? result.split(",")[1]
                : result;
              resolve(base64);
            } else {
              resolve("");
            }
          };
          reader.onerror = () => reject(new Error("파일을 읽는 데 실패했습니다."));
          reader.readAsDataURL(file);
        })
    );

    Promise.all(readers)
      .then((base64Images) => {
        setUploadedImages((prev) => [...prev, ...base64Images]);
      })
      .catch(() => {
        setUploadedImages((prev) => [...prev]);
      });
  };

  // ✅ 이미지 선택/해제
  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  // ✅ 개별 삭제
  const handleRemove = (id) => {
    const indexToRemove = images.findIndex((img) => img.id === id);
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelected((prev) => prev.filter((sid) => sid !== id));
    if (indexToRemove !== -1) {
      setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    }
  };

  // ✅ 전체 삭제
  const handleClearAll = () => {
    setImages([]);
    setSelected([]);
    setUploadedImages([]);
  };

  // ✅ 전체 선택
  const handleSelectAll = () => {
    setSelected(images.map((img) => img.id));
  };

  // ✅ 전체 해제
  const handleUnselectAll = () => {
    setSelected([]);
  };

  return (
    <div className="upload-container">
      {/* 버튼 영역 */}
      <div className="upload-actions">
        <button className="btn" onClick={handleSelectAll}>
          전체선택
        </button>
        <button className="btn" onClick={handleUnselectAll}>
          전체해제
        </button>
        <button className="btn" onClick={handleClearAll}>
          전체삭제
        </button>
      </div>

      {/* 업로드 박스 */}
      <div className="upload-box">
        <label className="upload-label">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <p>📁 클릭 또는 드래그하여 이미지 업로드 (최대 50장)</p>
        </label>
      </div>

      {/* 썸네일 미리보기 */}
      <div className="thumbnail-grid">
        {images.map((img) => (
          <div
            key={img.id}
            className={`thumbnail ${
              selected.includes(img.id) ? "selected" : ""
            }`}
            onClick={() => handleSelect(img.id)}
          >
            <img src={img.id} alt="thumbnail" />
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(img.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* ✅ 업로드된 이미지 썸네일 표시 */}
      <div className="upload-thumbs">
        {uploadedImages.map((img, i) => (
          <img
            key={i}
            src={`data:image/png;base64,${img}`}
            alt={`업로드된 이미지 ${i + 1}`}
            className="thumb"
          />
        ))}
      </div>
    </div>
  );
}
