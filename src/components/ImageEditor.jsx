import React from "react";

export default function ImageEditor({ selectedImage }) {
  // ✅ 이미지 URL 생성기
  const getImageURL = () => {
    if (!selectedImage) return null;
    if (selectedImage.file) return URL.createObjectURL(selectedImage.file);
    if (typeof selectedImage === "string") return `data:image/png;base64,${selectedImage}`;
    return null;
  };

  const imgSrc = getImageURL();

  return (
    <div className="editor-section">
      {!imgSrc ? (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>이미지를 선택하세요.</p>
      ) : (
        <div className="preview-box">
          <img
            src={imgSrc}
            alt="편집 이미지 미리보기"
            style={{ maxWidth: "100%", borderRadius: "8px" }}
          />
          {/* 여기에 필터, 크롭, 배경제거 등 버튼들 위치 */}
        </div>
      )}
    </div>
  );
}
