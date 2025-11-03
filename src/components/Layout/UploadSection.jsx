import React from "react";
import ImageUpload from "../ImageUpload";

export default function UploadSection({
  images,
  setImages,
  selectedImage,
  setSelectedImage,
  selectedImages,
  setSelectedImages,
}) {
  const handleImagesUploaded = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
    if (newImages.length > 0) {
      setSelectedImage(newImages[0]);
    }
  };

  return (
    <section className="app-section">
      <div className="section-header">📁 이미지 업로드</div>
      <ImageUpload
        onImagesUploaded={handleImagesUploaded}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
      />
    </section>
  );
}
