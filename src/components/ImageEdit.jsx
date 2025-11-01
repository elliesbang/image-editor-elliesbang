import React, { useState } from "react";
import "./ImageEdit.css";

export default function ImageEdit({ uploadedImages = [], setResults }) {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [loading, setLoading] = useState(false);

  // ✅ 선택된 이미지
  const selectedImage =
    selectedIndex !== null ? uploadedImages[selectedIndex] : null;

  // ✅ 이미지 클릭 선택
  const handleSelect = (index) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  // ✅ Base64 → Blob 변환
  const base64ToBlob = (base64) => {
    const byteString = atob(base64.split(",")[1] || base64);
    const mimeString = base64.includes("data:")
      ? base64.split(":")[1].split(";")[0]
      : "image/png";
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
    return new Blob([ab], { type: mimeString });
  };

  // ✅ OpenAI API 호출
  const callOpenAI = async (img, prompt = "배경을 제거하세요") => {
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
  };

  // ✅ 이미지 처리
  const handleProcess = async (type) => {
    if (!selectedImage) return alert("이미지를 선택해주세요!");
    setLoading(true);

    let prompt = "배경을 제거하세요";
    if (type === "crop") prompt = "중심 피사체만 남기고 크롭하세요";
    if (type === "removeBgCrop")
      prompt = "배경을 제거하고 피사체만 크롭하세요";
    if (type === "denoise")
      prompt = "이미지의 노이즈를 제거하고 선명하게 만드세요";

    const result = await callOpenAI(selectedImage, prompt);

    if (result) {
      setResults((prev) => [...prev, result]);
      alert("처리 완료!");
    } else {
      alert("처리 실패. 다시 시도해주세요.");
    }

    setLoading(false);
  };

  return (
    <section className="section-card">
      <h2 className="section-title">🧩 이미지 편집</h2>

      {loading && (
        <p className="loading">이미지 처리 중입니다... 잠시만 기다려주세요.</p>
      )}

      {/* ✅ 썸네일 목록 */}
      <div className="thumbnail-grid">
        {uploadedImages.map((img, i) => (
          <div
            key={i}
            className={`thumb-wrapper ${
              selectedIndex === i ? "selected" : ""
            }`}
            onClick={() => handleSelect(i)}
          >
            <img
              src={`data:image/png;base64,${img}`}
              alt={`업로드된 이미지 ${i + 1}`}
              className="thumb-image"
            />
            {selectedIndex === i && <div className="thumb-overlay">✔</div>}
          </div>
        ))}
      </div>

      /* 🔸 이미지 편집 버튼 (2x2 Grid) */
.image-edit-buttons {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  justify-items: center;
  margin-top: 24px;
}

.image-edit-buttons button {
  background: #ffd331;
  border: none;
  border-radius: 10px;
  padding: 18px 10px;
  width: 200px;
  height: 70px;
  font-weight: 600;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 3px 6px rgba(255, 211, 49, 0.25);
}

.image-edit-buttons button:hover {
  background: #ffe98c;
  transform: translateY(-2px);
}

/* 🔹 모바일 대응 (한 줄씩 정렬) */
@media (max-width: 600px) {
  .image-edit-buttons {
    grid-template-columns: 1fr;
  }

  .image-edit-buttons button {
    width: 90%;
  }
}
