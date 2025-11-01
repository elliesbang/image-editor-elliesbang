 import React, { useState } from "react";
import "./ImageEdit.css";

export default function ImageEdit({ uploadedImages = [], setResults }) {
  const [selectedImages, setSelectedImages] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 이미지 선택 토글 (인덱스 기준으로 변경)
  const toggleSelect = (index) => {
    setSelectedImages((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  // ✅ 전체 선택 / 해제 / 삭제
  const handleSelectAll = () =>
    setSelectedImages(uploadedImages.map((_, idx) => idx));

  const handleDeselectAll = () => setSelectedImages([]);

  const handleDeleteAll = () => {
    if (window.confirm("선택된 이미지를 모두 삭제하시겠습니까?")) {
      setSelectedImages([]);
    }
  };

  // ✅ Base64 → Blob 변환
  const base64ToBlob = (base64) => {
    const byteString = atob(base64.split(",")[1] || base64);
    const mimeString = base64.includes("data:")
      ? base64.split(":")[1].split(";")[0]
      : "image/png";
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mimeString });
  };

  // ✅ OpenAI API 호출
  const callOpenAI = async (img, prompt = "배경을 제거하세요") => {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      const formData = new FormData();
      const blob = base64ToBlob(img);
      formData.append("image", blob, "input.png");
      formData.append("model", "gpt-image-1");
      formData.append("prompt", prompt);

      const res = await fetch("https://api.openai.com/v1/images/edits", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
        body: formData,
      });

      const data = await res.json();
      if (data?.data?.[0]?.b64_json) return data.data[0].b64_json;
      console.error("OpenAI 응답 오류:", data);
      return null;
    } catch (error) {
      console.error("이미지 처리 오류:", error);
      return null;
    }
  };

  // ✅ 이미지 처리
  const handleProcess = async (type) => {
    if (!selectedImages.length) return alert("이미지를 선택해주세요!");
    setLoading(true);
    const newResults = [];

    for (const index of selectedImages) {
      const img = uploadedImages[index];
      let prompt = "배경을 제거하세요";
      if (type === "crop") prompt = "중심 피사체만 남기고 크롭하세요";
      if (type === "removeBgCrop") prompt = "배경을 제거하고 피사체만 크롭하세요";
      if (type === "denoise") prompt = "이미지의 노이즈를 제거하고 선명하게 만드세요";

      const result = await callOpenAI(img, prompt);
      if (result) newResults.push(result);
    }

    setResults((prev) => [...prev, ...newResults]);
    setLoading(false);
  };

  return (
    <section className="section-box">
      <h2>🧩 이미지 편집</h2>

      {loading && (
        <p className="loading">이미지 처리 중입니다... 잠시만 기다려주세요.</p>
      )}

      {/* ✅ 전체 선택/해제/삭제 버튼 */}
      <div className="edit-controls">
        <button onClick={handleSelectAll}>전체 선택</button>
        <button onClick={handleDeselectAll}>전체 해제</button>
        <button onClick={handleDeleteAll}>전체 삭제</button>
      </div>

      {/* ✅ 편집 기능 2x2 버튼 */}
      <h3 className="edit-section-title">편집 기능</h3>
      <div className="action-grid">
        <button
          disabled={loading}
          onClick={() => handleProcess("removeBg")}
        >
          🧹 배경 제거
        </button>
        <button
          disabled={loading}
          onClick={() => handleProcess("crop")}
        >
          ✂️ 크롭
        </button>
        <button
          disabled={loading}
          onClick={() => handleProcess("removeBgCrop")}
        >
          🪄 배경 제거 + 크롭
        </button>
        <button
          disabled={loading}
          onClick={() => handleProcess("denoise")}
        >
          ✨ 노이즈 제거
        </button>
      </div>

      {/* ✅ 이미지 썸네일 목록 */}
      <div className="thumbnail-grid">
        {uploadedImages.map((img, idx) => (
          <div
            key={idx}
            className={`thumb-wrapper ${
              selectedImages.includes(idx) ? "selected" : ""
            }`}
            onClick={() => toggleSelect(idx)}
          >
            <img
              src={`data:image/png;base64,${img}`}
              alt={`업로드된 이미지 ${idx + 1}`}
              className="thumb-image"
            />
            {selectedImages.includes(idx) && (
              <div className="thumb-overlay">✔</div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
