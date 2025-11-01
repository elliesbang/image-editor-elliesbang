import React, { useState } from "react";
import "./ImageEdit.css";

export default function ImageEdit({ uploadedImages = [], setResults }) {
  const [selectedImages, setSelectedImages] = useState([]); // 인덱스 기반 선택
  const [loading, setLoading] = useState(false);

  // ✅ 이미지 클릭 시 선택/해제
  const toggleSelect = (index) => {
    setSelectedImages((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
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
        headers: { Authorization: `Bearer ${apiKey}` },
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

  // ✅ 이미지 처리 (선택된 이미지만)
  const handleProcess = async (type) => {
    if (!selectedImages.length) {
      alert("편집할 이미지를 선택해주세요!");
      return;
    }

    setLoading(true);
    const newResults = [];

    for (const index of selectedImages) {
      const img = uploadedImages[index]; // base64로 매칭
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

      {/* ✅ 편집 기능 버튼 */}
      <div className="action-grid">
        <button onClick={() => handleProcess("removeBg")} disabled={loading}>
          🧹 배경 제거
        </button>
        <button onClick={() => handleProcess("crop")} disabled={loading}>
          ✂️ 크롭
        </button>
        <button onClick={() => handleProcess("removeBgCrop")} disabled={loading}>
          🪄 배경 제거 + 크롭
        </button>
        <button onClick={() => handleProcess("denoise")} disabled={loading}>
          ✨ 노이즈 제거
        </button>
      </div>

      {/* ✅ 업로드된 이미지 목록 */}
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
          </div>
        ))}
      </div>
    </section>
  );
}
