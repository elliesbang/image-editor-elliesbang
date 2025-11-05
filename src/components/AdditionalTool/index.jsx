import React from "react";
import ResizeTool from "./ResizeTool";
import SvgConvertTool from "./SvgConvertTool";
import GifConvertTool from "./GifConvertTool";
import KeywordAnalyzeTool from "./KeywordAnalyzeTool";

export default function AdditionalTool({
  selectedImage,
  selectedImages = [],
  selectedResultImage,
  setSelectedImages,
}) {
  // ✅ 단일/다중 이미지 모두 대응
  const hasImage = !!selectedImage || selectedImages.length > 0;

  // ✅ 항상 배열 형태로 전달 (단일 선택도 배열화)
  const activeImages =
    Array.isArray(selectedImages) && selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

  return (
    <div className="additional-section">
      <div className="button-grid">
        {/* ✅ 모든 추가 기능에 배열 전달 */}
        <ResizeTool
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
          setSelectedImages={setSelectedImages}
        />
        <SvgConvertTool
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
        />
        <GifConvertTool
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
        />
        <KeywordAnalyzeTool
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
        />
      </div>

      {!hasImage && (
        <p
          style={{
            color: "#999",
            fontSize: "0.9rem",
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          처리된 이미지를 선택하면 추가 기능이 활성화됩니다.
        </p>
      )}
    </div>
  );
}
