import React from "react";
import RemoveBgButton from "./RemoveBgButton";
import RemoveBgCropButton from "./RemoveBgCropButton";
import CropButton from "./CropButton";
import DenoiseButton from "./DenoiseButton";

export default function ImageEditor({ selectedImage, selectedImages = [] }) {
  // 단일 이미지 또는 여러 이미지 중 하나라도 있으면 true
  const hasImage = !!selectedImage || selectedImages.length > 0;

  // 배열 전달 보장 (selectedImages가 비었으면 단일 이미지라도 포함)
  const activeImages =
    selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

  return (
    <div className="editor-section">
      <div className="button-grid">
        {/* ✅ 수정된 부분들: 배열 전달 */}
        <RemoveBgButton
          selectedImages={activeImages}
          disabled={!hasImage}
        />
        <RemoveBgCropButton
          selectedImages={activeImages}
          disabled={!hasImage}
        />
        <CropButton
          selectedImages={activeImages}
          disabled={!hasImage}
        />
        <DenoiseButton
          selectedImages={activeImages}
          disabled={!hasImage}
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
          이미지를 선택하면 버튼이 활성화됩니다.
        </p>
      )}
    </div>
  );
}
