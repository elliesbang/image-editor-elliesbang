import React, { useState } from "react";

const ImageUpload = ({ onImagesUploaded, selectedImage, setSelectedImage }) => {
  const [images, setImages] = useState([]);

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
  const handleSelectImage = (img) => setSelectedImage(img);

  return (
    <div className="upload-section">
      <input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="upload-input"
      />
      <div className="thumbnail-grid">
        {images.map((img, i) => (
          <img
            key={i}
            src={img.thumbnail}
            alt="thumbnail"
            className={`thumb ${selectedImage === img ? "selected" : ""}`}
            onClick={() => handleSelectImage(img)}
          />
        ))}
      </div>
    </div>
  );
};

export default ImageUpload;
