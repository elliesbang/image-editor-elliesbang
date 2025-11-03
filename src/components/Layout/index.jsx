import React from "react";
import UploadSection from "./UploadSection";
import EditSection from "./EditSection";
import ResultSection from "./ResultSection";
import ExtraSection from "./ExtraSection";

export default function Layout({
  images,
  setImages,
  selectedImage,
  setSelectedImage,
  selectedImages,
  setSelectedImages,
  selectedResult,
  setSelectedResult,
}) {
  return (
    <main className="app-main">
      <UploadSection
        images={images}
        setImages={setImages}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
      />

      <EditSection
        selectedImage={selectedImage}
        setSelectedResult={setSelectedResult}
      />

      <ResultSection
        images={images}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
        selectedResult={selectedResult}
        setSelectedResult={setSelectedResult}
      />

      <ExtraSection
        selectedImage={selectedImage}
        selectedResult={selectedResult}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
      />
    </main>
  );
}
