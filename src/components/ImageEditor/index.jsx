import React from "react";
import RemoveBgButton from "./RemoveBgButton";
import RemoveBgCropButton from "./RemoveBgCropButton";
import CropButton from "./CropButton";
import DenoiseButton from "./DenoiseButton";

export default function ImageEditor({ selectedImage }) {
  const hasImage = !!selectedImage;

  return (
    <div className="editor-section">
      <div className="button-grid">
        <RemoveBgButton selectedImage={selectedImage} disabled={!hasImage} />
        <RemoveBgCropButton selectedImage={selectedImage} disabled={!hasImage} />
        <CropButton selectedImage={selectedImage} disabled={!hasImage} />
        <DenoiseButton selectedImage={selectedImage} disabled={!hasImage} />
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
