import React from "react";

const ImageEditor = ({ selectedImage }) => {
  const handleEdit = async (action) => {
    if (!selectedImage) {
      alert("이미지를 선택하세요!");
      return;
    }

    // 기존 편집 기능(API 호출 등)은 변경하지 않음
    console.log("편집 실행:", action, selectedImage.file);
  };

  return (
    <div className="editor-buttons">
      <button onClick={() => handleEdit("remove-bg")}>배경제거</button>
      <button onClick={() => handleEdit("crop")}>크롭</button>
      <button onClick={() => handleEdit("remove-bg-crop")}>
        배경제거+크롭
      </button>
      <button onClick={() => handleEdit("denoise")}>노이즈 제거</button>
    </div>
  );
};

export default ImageEditor;
