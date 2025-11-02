import React, { useState } from "react";

const ImageEditor = ({ selectedImage }) => {
  const [loading, setLoading] = useState(false);

  // ✅ 공통 처리 함수
  const handleEdit = async (action) => {
    if (!selectedImage) {
      alert("이미지를 선택하세요!");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage.file);

      // ✅ 선택한 기능(action)에 따라 다른 API 호출
      const res = await fetch(`/api/${action}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`${action} 실패 (${res.status})`);

      const data = await res.json();
      console.log(`✅ ${action} 성공:`, data);

      alert(`${action} 처리가 완료되었습니다!`);
    } catch (err) {
      console.error("❌ 처리 실패:", err);
      alert("처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="editor-buttons">
      <button onClick={() => handleEdit("remove-bg")} disabled={loading}>
        {loading ? "처리 중..." : "배경제거"}
      </button>
      <button onClick={() => handleEdit("crop")} disabled={loading}>
        크롭
      </button>
      <button onClick={() => handleEdit("remove-bg-crop")} disabled={loading}>
        배경제거+크롭
      </button>
      <button onClick={() => handleEdit("denoise")} disabled={loading}>
        노이즈 제거
      </button>
    </div>
  );
};

export default ImageEditor;
