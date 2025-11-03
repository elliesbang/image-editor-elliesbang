import React from "react";
import ImageEditor from "../ImageEditor";

export default function EditSection({ selectedImage, setSelectedResult }) {
  return (
    <section className="app-section">
      <div className="section-header">🎨 이미지 편집</div>
      <ImageEditor
        selectedImage={selectedImage}
        onProcessComplete={setSelectedResult}
      />
    </section>
  );
}
