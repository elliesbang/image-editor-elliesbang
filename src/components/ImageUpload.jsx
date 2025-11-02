import React, { useState } from "react";

const ImageUpload = ({ onImagesUploaded, selectedImage, setSelectedImage }) => {
  const [images, setImages] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]);

  const handleImageUpload = (files) => {
    if (files.length > 50) {
      alert("한 번에 50장까지만 업로드할 수 있습니다.");
      return;
    }

    const newImages = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file);
      return { file, thumbnail: url };
    });

    setImages((prev) => [...prev, ...newImages]);
    onImagesUploaded(newImages);
  };

  const handleFileChange = (e) => handleImageUpload(e.target.files);
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
    <div className="upload-section">
      {/* ✅ 파일 업로드 */}
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="upload-input"
      />

      {/* ✅ 전체 선택/해제/삭제 버튼 */}
      {images.length > 0 && (
        <div className="edit-buttons">
          <button onClick={handleSelectAll}>전체 선택</button>
          <button onClick={handleDeselectAll}>전체 해제</button>
          <button onClick={handleDeleteAll}>전체 삭제</button>
        </div>
      )}

      {/* ✅ 썸네일 */}
      <div className="thumbnail-grid">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.thumbnail}
            alt="thumbnail"
            className={`thumb ${selectedImages.includes(img) ? "selected" : ""}`}
            onClick={() => handleSelectImage(img)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
