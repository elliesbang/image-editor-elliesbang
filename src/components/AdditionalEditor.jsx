import React from "react";

const AdditionalEditor = ({ selectedImage }) => {
  const handleResize = () => {
    if (!selectedImage) {
      alert("이미지를 선택하세요!");
      return;
    }
    console.log("리사이즈 실행:", selectedImage.file);
  };

  const handleConvert = (type) => {
    if (!selectedImage) {
      alert("이미지를 선택하세요!");
      return;
    }
    console.log(`변환 실행: ${type}`, selectedImage.file);
  };

  return (
    <div className="additional-editor">
      <button onClick={handleResize}>리사이즈</button>
      <button onClick={() => handleConvert("svg")}>SVG 변환</button>
      <button onClick={() => handleConvert("gif")}>GIF 변환</button>
    </div>
  );
};

export default AdditionalEditor;
