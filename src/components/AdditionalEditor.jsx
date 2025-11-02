import React, { useState } from "react";

export default function AdditionalEditor({ selectedImage }) {
  const [resizeW, setResizeW] = useState("");
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ 안전하게 이미지 가져오기 (파일, 썸네일, base64 모두 대응)
  const getCurrentImage = () => {
    if (!selectedImage) return null;
    if (selectedImage.file instanceof File) return selectedImage.file;
    if (selectedImage.thumbnail) return selectedImage.thumbnail;
    if (typeof selectedImage === "string") return selectedImage;
    return null;
  };

  // ✅ base64 변환
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

  // ✅ 공통 API 호출 함수
  const processImage = async (endpoint, extra = {}) => {
    const currentImage = getCurrentImage();
    if (!currentImage) return alert("이미지를 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();

      // File 또는 base64 대응
      if (currentImage instanceof File) {
        formData.append("image", currentImage);
      } else if (typeof currentImage === "string") {
        // ✅ data:image 접두사가 있으면 제거
        const cleanBase64 = currentImage.replace(/^data:image\/(png|jpeg);base64,/, "");
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
        formData.append("image", blob, "image.png");
      }

      for (const [k, v] of Object.entries(extra)) formData.append(k, v);

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
    if (!currentImage) return alert("이미지를 선택하세요!");
    if (!resizeW) return alert("가로(px)를 입력하세요!");
    await processImage("resize", { width: resizeW });
  };

  // ✅ 키워드 분석
  const handleAnalyze = async () => {
    const currentImage = getCurrentImage();
    if (!currentImage) return alert("이미지를 선택하세요!");
    setLoading(true);

    try {
      const blob =
        currentImage instanceof File
          ? currentImage
          : await fetch(`data:image/png;base64,${currentImage}`).then((r) => r.blob());
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

  // ✅ 키워드 복사
  const copyKeywords = () => {
    if (keywords.length === 0) return;
    navigator.clipboard.writeText(keywords.join(", "));
    alert("키워드가 복사되었습니다 ✅");
  };

  return (
    <div className="tools-wrap">
      <h3>✨ 추가 기능</h3>

      {/* ✅ 리사이즈 */}
      <div className="tool-row">
        <label className="tool-title">리사이즈</label>
        <input
          type="number"
          className="input"
          placeholder="가로(px) 입력"
          value={resizeW}
          onChange={(e) => setResizeW(e.target.value)}
        />
        <button className="btn" onClick={handleResize} disabled={loading}>
          자동 리사이즈
        </button>
      </div>

      {/* ✅ SVG 변환 */}
      <div className="tool-row">
        <label className="tool-title">SVG 변환</label>
        <button
          className="btn"
          onClick={() => processImage("convert-svg")}
          disabled={loading}
        >
          SVG 변환
        </button>
      </div>

      {/* ✅ GIF 변환 */}
      <div className="tool-row">
        <label className="tool-title">GIF 변환</label>
        <button
          className="btn"
          onClick={() => processImage("convert-gif")}
          disabled={loading}
        >
          GIF 변환
        </button>
      </div>

      {/* ✅ 키워드 분석 */}
      <div className="tool-row">
        <label className="tool-title">키워드 분석</label>
        <div className="keyword-box">
          <p className="keyword-text">
            {keywords.length ? keywords.join(", ") : "분석 결과가 여기에 표시됩니다."}
          </p>
          <button className="copy-btn" onClick={copyKeywords}>
            복사
          </button>
        </div>
        <button className="btn" onClick={handleAnalyze} disabled={loading}>
          키워드 분석
        </button>
      </div>
    </div>
  );
}