import React, { useState, useEffect } from "react";

export default function AdditionalEditor({ selectedImage }) {
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 이미지 안정적으로 가져오기 (객체, File, base64 모두 인식)
  const getCurrentImage = () => {
    if (!selectedImage) return null;

    // File 객체
    if (selectedImage instanceof File) return selectedImage;

    // 객체 형태 ({ file, thumbnail })
    if (typeof selectedImage === "object") {
      if (selectedImage.file instanceof File) return selectedImage.file;
      if (selectedImage.thumbnail)
        return `data:image/png;base64,${selectedImage.thumbnail}`;
    }

    // 문자열 형태 (base64 or dataURL)
    if (typeof selectedImage === "string") {
      if (selectedImage.startsWith("data:image")) return selectedImage;
      return `data:image/png;base64,${selectedImage}`;
    }

    return null;
  };

  // ✅ base64 변환 유틸
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

  // ✅ 공용 이미지 처리 함수
  const processImage = async (endpoint, extra = {}) => {
    const currentImage = getCurrentImage();
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();

      if (currentImage instanceof File) {
        formData.append("image", currentImage);
      } else if (typeof currentImage === "string") {
        const cleanBase64 = currentImage.replace(/^data:image\/(png|jpeg);base64,/, "");
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
        formData.append("image", blob, "image.png");
      }

      // 추가 파라미터
      for (const [key, value] of Object.entries(extra)) {
        formData.append(key, value);
      }

      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.result) throw new Error(`${endpoint} 실패`);

      const blob = await fetch(`data:image/png;base64,${data.result}`).then((r) => r.blob());
      const file = new File([blob], "result.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: data.result },
        })
      );

      alert(`${endpoint} 완료!`);
    } catch (err) {
      console.error(`${endpoint} 오류:`, err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 리사이즈
  const handleResize = async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    if (!resizeW) return alert("가로(px)를 입력하세요!");
    await processImage("resize", { width: resizeW });
  };

  // ✅ 키워드 분석
  const handleAnalyze = async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const blob =
        currentImage instanceof File
          ? currentImage
          : await fetch(
              currentImage.startsWith("data:image")
                ? currentImage
                : `data:image/png;base64,${currentImage}`
            ).then((r) => r.blob());

      const base64 = await blobToBase64(blob);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      if (data.keywords?.length) setKeywords(data.keywords);
      else alert("분석 결과가 없습니다.");
    } catch (err) {
      console.error("분석 오류:", err);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyKeywords = () => {
    if (!keywords.length) return;
    navigator.clipboard.writeText(keywords.join(", "));
    alert("키워드가 복사되었습니다 ✅");
  };

  return (
    <div className="tools-wrap">
      <h3>✨ 추가 기능</h3>

      {/* 🔹 리사이즈 */}
      <div className="tool-row">
        <label>리사이즈</label>
        <input
          type="number"
          className="input"
          placeholder="가로(px)"
          value={resizeW}
          onChange={(e) => setResizeW(e.target.value)}
        />
        <button className="btn" onClick={handleResize} disabled={loading}>
          리사이즈 실행
        </button>
      </div>

      {/* 🔹 SVG 변환 */}
     {/* 🔹 SVG 변환 */}
<div className="tool-block">
  <label>SVG 변환</label>
  <select
    className="input"
    defaultValue="1"
    id="svgColorSelect"
    style={{ marginBottom: "8px" }}
  >
    <option value="1">단색 (1-color)</option>
    <option value="2">2색 (2-color)</option>
    <option value="3">3색 (3-color)</option>
    <option value="4">4색 (4-color)</option>
    <option value="5">5색 (5-color)</option>
    <option value="6">6색 (6-color)</option>
  </select>

  <button
    className="btn"
    onClick={() => {
      const colors = document.getElementById("svgColorSelect").value;
      processImage("convert-svg", { colors });
    }}
    disabled={loading}
  >
    SVG 변환
  </button>
</div>

      {/* 🔹 GIF 변환 */}
<div className="tool-block">
  <label>GIF 변환</label>
  <input
    type="text"
    id="gifCaption"
    className="input"
    placeholder="GIF에 표시할 설명 텍스트 입력"
    style={{ marginBottom: "8px" }}
  />

  <button
    className="btn"
    onClick={() => {
      const caption = document.getElementById("gifCaption").value.trim();
      processImage("convert-gif", { caption });
    }}
    disabled={loading}
  >
    GIF 변환
  </button>
</div>
      
      {/* 🔹 키워드 분석 */}
<div className="tool-block">
  <label>키워드 분석</label>
  <textarea
    id="analyzeDesc"
    className="input"
    rows="2"
    placeholder="이미지 설명(선택 사항)"
    style={{ marginBottom: "8px" }}
  ></textarea>

  <button
    className="btn"
    onClick={async () => {
      const desc = document.getElementById("analyzeDesc").value;
      await handleAnalyze(desc);
    }}
    disabled={loading}
  >
    {loading ? "분석 중..." : "키워드 분석"}
  </button>

  {keywords.length > 0 && (
    <div className="keyword-result">
      <p>{keywords.join(", ")}</p>
      <button className="copy-btn" onClick={copyKeywords}>
        복사
      </button>
    </div>
  )}
 </div>
</div>       
