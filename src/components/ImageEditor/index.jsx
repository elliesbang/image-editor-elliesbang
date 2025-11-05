import React from "react";
import BackgroundRemoveButton from "../../features/background";
import RemoveBgCropButton from "../../features/backgroundCrop";
import CropButton from "../../features/crop";
import DenoiseButton from "../../features/denoise";

export default function ImageEditor({ selectedImage, selectedImages = [] }) {
  const hasImage = !!selectedImage || selectedImages.length > 0;

  const activeImages =
    Array.isArray(selectedImages) && selectedImages.length > 0
      ? selectedImages
      : selectedImage
      ? [selectedImage]
      : [];

  return (
    <div className="editor-section">
      <div className="button-grid">
        <BackgroundRemoveButton selectedImages={activeImages} disabled={!hasImage} />
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
