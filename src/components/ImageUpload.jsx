import React, { useState, useEffect } from "react";

const ImageUpload = ({
  onImagesUploaded,
  selectedImage,
  setSelectedImage,
  selectedImages,
  setSelectedImages,
}) => {
  const [images, setImages] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  // ✅ 업로드 중복 방지 + 썸네일 생성
  const handleImageUpload = (files) => {
    if (files.length > 50) {
      alert("한 번에 50장까지만 업로드할 수 있습니다.");
      return;
    }

    const fileArray = Array.from(files);
    const newImages = fileArray
      .filter((file) => !images.some((img) => img.file.name === file.name)) // ✅ 중복 방지
      .map((file) => ({
        file,
        thumbnail: URL.createObjectURL(file),
        id: `${file.name}-${file.lastModified}`, // ✅ 고유 ID
      }));

    const updated = [...images, ...newImages];
    setImages(updated);
    setSelectedImages([]); // ✅ 업로드 시 자동 선택 방지
    if (newImages.length > 0) setSelectedImage(newImages[0]);

    // ❌ 업로드 시 처리결과 섹션 자동 반영 방지
    // onImagesUploaded?.(newImages);
  };

  // ✅ 파일 input 업로드
  const handleFileChange = (e) => handleImageUpload(e.target.files);

  // ✅ 드래그 & 드롭
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const { files } = e.dataTransfer;
    if (files?.length > 0) {
      handleImageUpload(files);
      e.dataTransfer.clearData();
    }
  };

  const handleDragEnter = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  // ✅ 이미지 선택
  const handleSelectImage = (img) => {
    setSelectedImage(img);
    setSelectedImages((prev) =>
      prev.includes(img)
        ? prev.filter((i) => i !== img)
        : [...prev, img]
    );
  };

  // ✅ 전체 선택 / 해제 / 삭제
  const handleSelectAll = () => setSelectedImages([...images]);
  const handleDeselectAll = () => setSelectedImages([]);
  const handleDeleteAll = () => {
    if (window.confirm("모든 이미지를 삭제하시겠습니까?")) {
      images.forEach((img) => URL.revokeObjectURL(img.thumbnail)); // ✅ 메모리 정리
      setImages([]);
      setSelectedImages([]);
      setSelectedImage(null);
    }
  };

  // ✅ 개별 삭제
  const handleDeleteSingle = (img, index) => {
    URL.revokeObjectURL(img.thumbnail); // ✅ 썸네일 URL 정리
    setImages((prev) => prev.filter((_, i) => i !== index));
    setSelectedImages((prev) => prev.filter((i) => i !== img));
    if (selectedImage === img) {
      const remaining = images.filter((_, i) => i !== index);
      setSelectedImage(remaining[0] || null);
    }
  };

  // ✅ images 변경 시 자동 정리
  useEffect(() => {
    if (selectedImage && !images.includes(selectedImage)) {
      setSelectedImage(null);
    }
    if (selectedImages?.length) {
      setSelectedImages((prev) => prev.filter((img) => images.includes(img)));
    }
  }, [images]);

  return (
    <div
      className={`upload-section ${isDragging ? "dragging" : ""}`}
      onDrop={handleDrop}
      onDragEnter={handleDragEnter}
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
          <div
            key={img.id || i}
            className={`thumb-wrapper ${selectedImages.includes(img) ? "selected" : ""}`}
            onClick={() => handleSelectImage(img)}
          >
            <div className="thumb-inner">
              <img src={img.thumbnail} alt={`thumbnail-${i}`} className="thumb" />
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSingle(img, i);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
