import React from "react";
import ProcessResult from "../ProcessResult";

export default function ResultSection({
  images,
  selectedImage,
  setSelectedImage,
  selectedResult,
  setSelectedResult,
}) {
  return (
    <section className="app-section">
      <div className="section-header">🎉 처리 결과</div>
      <ProcessResult
        images={images}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        selectedResult={selectedResult}
        setSelectedResult={setSelectedResult}
      />
    </section>
  );
}
