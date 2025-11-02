import React, { useState } from "react";

export default function AdditionalEditor({ selectedImage }) {
  const [loading, setLoading] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [resizeValue, setResizeValue] = useState(50);

  // ✅ 공통 이미지 처리 함수
  const processImage = async (endpoint, extraData = {}) => {
    if (!selectedImage) return alert("이미지를 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();

      // File 객체나 base64 모두 지원
      if (selectedImage.file) {
        formData.append("image", selectedImage.file);
      } else {
        const byteCharacters = atob(selectedImage);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], {
          type: "image/png",
        });
        formData.append("image", blob, "image.png");
      }

      // 리사이즈, 기타 옵션 추가
      for (const [key, value] of Object.entries(extraData)) {
        formData.append(key, value);
      }

      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`${endpoint} 요청 실패`);
      const data = await res.json();

      // ✅ 결과 반영 (처리결과 컴포넌트로 이벤트 전송)
      if (data.result) {
        const blob = await fetch(`data:image/png;base64,${data.result}`).then((r) =>
          r.blob()
        );
        const file = new File([blob], "result.png", { type: "image/png" });
        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: { file, thumbnail: data.result },
          })
        );
        alert(`${endpoint} 완료!`);
      } else {
        alert("결과 이미지가 없습니다.");
      }
    } catch (err) {
      console.error(`${endpoint} 오류:`, err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ 키워드 분석
  const analyzeKeywords = async () => {
    if (!selectedImage) return alert("이미지를 선택하세요!");
    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (data.success && data.keywords?.length > 0) {
        setKeywords(data.keywords);
      } else {
        alert("키워드 분석 결과가 없습니다.");
      }
    } catch (err) {
      alert("키워드 분석 중 오류가 발생했습니다.");
      console.error(err);
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
    <div className="additional-editor">
      <h3>✨ 추가 기능</h3>

      <div className="button-grid">
        <button
          disabled={loading || !selectedImage}
          onClick={() => processImage("resize", { scale: resizeValue })}
        >
          리사이즈
        </button>

        <button
          disabled={loading || !selectedImage}
          onClick={() => processImage("convert-svg")}
        >
          SVG 변환
        </button>

        <button
          disabled={loading || !selectedImage}
          onClick={() => processImage("convert-gif")}
        >
          GIF 변환
        </button>

        <button
          disabled={loading || !selectedImage}
          onClick={analyzeKeywords}
        >
          키워드 분석
        </button>
      </div>

      {/* ✅ 리사이즈 슬라이더 */}
      <div className="resize-control">
        <label>크기 조정: {resizeValue}%</label>
        <input
          type="range"
          min="10"
          max="200"
          step="10"
          value={resizeValue}
          onChange={(e) => setResizeValue(e.target.value)}
        />
      </div>

      {/* ✅ 키워드 결과 */}
      {keywords.length > 0 && (
        <div className="keyword-result">
          <div className="keyword-header">
            <h4>📋 키워드 분석 결과</h4>
            <button className="copy-btn" onClick={copyKeywords}>
              복사
            </button>
          </div>
          <ul className="keyword-list">
            {keywords.map((kw, idx) => (
              <li key={idx}># {kw}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}