import React from "react";
import RemoveBgButton from "./RemoveBgButton";
import RemoveBgCropButton from "./RemoveBgCropButton";
import CropButton from "./CropButton";
import DenoiseButton from "./DenoiseButton";

export default function ImageEditor({ selectedImage, selectedImages = [] }) {
  // ✅ 단일 또는 다중 이미지 여부
  const hasImage = !!selectedImage || selectedImages.length > 0;

  // ✅ 항상 배열 형태로 전달 (단일 선택도 배열화)
  const activeImages =
    Array.isArray(selectedImages) && selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

  return (
    <div className="editor-section">
      <div className="button-grid">
        {/* ✅ 모든 버튼에 배열 전달 */}
        <RemoveBgButton selectedImages={activeImages} disabled={!hasImage} />
        <RemoveBgCropButton selectedImages={activeImages} disabled={!hasImage} />
        <CropButton selectedImages={activeImages} disabled={!hasImage} />
        <DenoiseButton selectedImages={activeImages} disabled={!hasImage} />
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
