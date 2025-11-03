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
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files && files.length > 0) {
      handleImageUpload(files);
      e.dataTransfer.clearData(); // ✅ 기본 drag data 초기화
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true); // ✅ 드래그 시작 시 강조
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy"; // ✅ 브라우저가 파일 열지 않도록
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

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
      onDragEnter={handleDragEnter} // ✅ 추가됨
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      {/* ✅ 파일 업로드 입력 */}
      <input
        id="file-upload"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="upload-input"
      />

      {/* ✅ 업로드 영역 */}
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
    </div>
  );
};

export default ImageUpload;
