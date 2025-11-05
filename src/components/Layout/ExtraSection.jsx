import React from "react";
import {
  ResizeTool,
  SvgConvertTool,
  GifConvertTool,
  KeywordAnalyzeTool,
} from "../AdditionalTool";

export default function ExtraSection({
  selectedImage,
  selectedResult,
  selectedImages,
  setSelectedImages,
}) {
  const activeSelectedImages = Array.isArray(selectedImages)
    ? selectedImages
    : [];
  const selectedResultImages = selectedResult ? [selectedResult] : [];

  return (
    <section className="app-section">
      <div className="section-header">⚙️ 추가 기능</div>
      <div className="tools-grid">
        <ResizeTool
          selectedImage={selectedImage}
          selectedImages={activeSelectedImages}
          selectedResultImage={selectedResult}
          selectedResultImages={selectedResultImages}
        />
        <SvgConvertTool
          selectedImage={selectedImage}
          selectedImages={activeSelectedImages}
          selectedResultImage={selectedResult}
          selectedResults={selectedResultImages}
        />
        <GifConvertTool
          selectedImage={selectedImage}
          selectedImages={activeSelectedImages}
          selectedResultImage={selectedResult}
          selectedResults={selectedResultImages}
        />
        <KeywordAnalyzeTool
          selectedImage={selectedImage}
          selectedImages={activeSelectedImages}
          selectedResultImage={selectedResult}
          selectedResultImages={selectedResultImages}
        />
      </div>
    </section>
  );
}
