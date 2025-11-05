import ResizeTool from "../../features/resize";
import SvgConvertTool from "../../features/convert/SvgConvert";
import GifConvertTool from "../../features/convert/GifConvert";
import KeywordAnalyzeTool from "../../features/keyword";

export default function AdditionalTool({
  selectedImage,
  selectedImages = [],
  selectedResultImage,
  selectedResultImages = [],
}) {
  const hasImage = !!selectedImage || selectedImages.length > 0;

  const activeImages =
    Array.isArray(selectedImages) && selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

  const activeResults =
    Array.isArray(selectedResultImages) && selectedResultImages.length > 0
      ? selectedResultImages
      : selectedResultImage
      ? [selectedResultImage]
      : [];

  return (
    <div className="additional-section">
      <div className="button-grid">
        <ResizeTool
          selectedImage={selectedImage}
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
          selectedResultImages={activeResults}
        />
        <SvgConvertTool
          selectedImage={selectedImage}
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
          selectedResults={activeResults}
        />
        <GifConvertTool
          selectedImage={selectedImage}
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
          selectedResults={activeResults}
        />
        <KeywordAnalyzeTool
          selectedImage={selectedImage}
          selectedImages={activeImages}
          selectedResultImage={selectedResultImage}
          selectedResultImages={activeResults}
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

export { ResizeTool, SvgConvertTool, GifConvertTool, KeywordAnalyzeTool };
