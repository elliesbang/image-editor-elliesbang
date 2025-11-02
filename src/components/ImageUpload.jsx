import React, { useState } from "react";

const ImageUpload = ({ onImagesUploaded, selectedImage, setSelectedImage }) => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ 이미지 업로드 (50장 제한)
  const handleImageUpload = (files) => {
    if (files.length > 50) {
      alert("한 번에 50장까지만 업로드할 수 있습니다.");
      return;
    }

    const newImages = Array.from(files).map((file) => ({
      file,
      thumbnail: URL.createObjectURL(file),
    }));

    setImages((prev) => [...prev, ...newImages]);
    onImagesUploaded(newImages);
  };

  const handleFileChange = (e) => handleImageUpload(e.target.files);

  // ✅ 드래그 & 드롭
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleImageUpload(e.dataTransfer.files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  // ✅ 이미지 선택 / 해제
  const handleSelectImage = (img) => {
    setSelectedImage(img);
    setSelectedImages((prev) =>
      prev.includes(img) ? prev.filter((i) => i !== img) : [...prev, img]
    );
  };

  // ✅ 전체 선택 / 해제 / 삭제
  const handleSelectAll = () => setSelectedImages([...images]);
  const handleDeselectAll = () => setSelectedImages([]);
  const handleDeleteAll = () => {
    if (window.confirm("모든 이미지를 삭제하시겠습니까?")) {
      setImages([]);
      setSelectedImages([]);
      setSelectedImage(null);
    }
  };

  return (
    <div
      className={`upload-section ${isDragging ? "dragging" : ""}`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* ✅ 파일 업로드 입력 */}
      <input
        id="file-upload" // ✅ label과 연결됨
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="upload-input"
      />

      {/* ✅ 업로드 영역 (클릭 작동하도록 연결) */}
      <label htmlFor="file-upload" className="upload-box">
        <p className="upload-text">클릭 또는 이미지를 드래그하여 업로드</p>
        <p className="upload-sub">한 번에 최대 50장</p>
      </label>

      {/* ✅ 전체 선택/해제/삭제 버튼 */}
      {images.length > 0 && (
        <div className="control-buttons">
          <button onClick={handleSelectAll}>전체 선택</button>
          <button onClick={handleDeselectAll}>전체 해제</button>
          <button onClick={handleDeleteAll}>전체 삭제</button>
        </div>
      )}

{/* ✅ 썸네일 */}
<div className="thumbnail-grid">
  {images.map((img, i) => (
    <div key={i} className="thumb-wrapper">
      <img
        src={img.thumbnail}
        alt="thumbnail"
        className={`thumb ${selectedImages.includes(img) ? "selected" : ""}`}
        onClick={() => handleSelectImage(img)}
      />
      <button
        className="delete-btn"
        onClick={(e) => {
          e.stopPropagation();
          setImages(images.filter((_, idx) => idx !== i));
          setSelectedImages(selectedImages.filter((x) => x !== img));
        }}
      >
        ✕
      </button>
    </div>
  ))}
</div>
  </div> // ✅ 여기서 꼭 닫혀야 함
); // ✅ return 닫힘
} // ✅ 함수 닫힘

export default ImageUpload;
