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
  return (
    <section className="app-section">
      <div className="section-header">⚙️ 추가 기능</div>
      <div className="tools-grid">
        <ResizeTool
          selectedImage={selectedImage}
          selectedResultImage={selectedResult}
        />
        <SvgConvertTool
          selectedImage={selectedImage}
          selectedResultImage={selectedResult}
        />
        <GifConvertTool
          selectedImage={selectedImage}
          selectedResultImage={selectedResult}
        />
        <KeywordAnalyzeTool
          selectedImage={selectedImage}
          selectedResultImage={selectedResult}
        />
      </div>
    </section>
  );
}
