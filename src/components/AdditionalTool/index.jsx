// src/components/AdditionalTool/index.jsx
import ResizeTool from "./ResizeTool";
import SvgConvertTool from "./SvgConvertTool";
import GifConvertTool from "./GifConvertTool";
import KeywordAnalyzeTool from "./KeywordAnalyzeTool";

export default function AdditionalTool({
  selectedImage,
  selectedImages = [],
  selectedResultImage,
  selectedResultImages = [], // ✅ 추가
  setSelectedImages,
}) {
  const hasImage = !!selectedImage || selectedImages.length > 0;

  const activeImages =
    Array.isArray(selectedImages) && selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

  return (
    <div className="additional-section">
      <div className="button-grid">
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
          selectedImage={selectedImage}
          selectedImages={selectedImages}
          selectedResultImage={selectedResultImage}
          selectedResultImages={selectedResultImages} // ✅ 정상 작동
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

// ✅ 추가 (각 개별 툴 export)
export { ResizeTool, SvgConvertTool, GifConvertTool, KeywordAnalyzeTool };
