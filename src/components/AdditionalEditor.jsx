import React, { useState, useEffect } from "react";

export default function AdditionalEditor({ selectedImage }) {
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [aspectRatio, setAspectRatio] = useState(null);
  const [keywords, setKeywords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [imageData, setImageData] = useState(null);

  // ✅ 추가: SVG 색상 수, GIF 설명
  const [svgColors, setSvgColors] = useState("1");
  const [gifDesc, setGifDesc] = useState("");

  // ✅ 선택된 이미지 반영
  useEffect(() => {
    if (!selectedImage) return;
    if (selectedImage.file instanceof File) setImageData(selectedImage.file);
    else if (selectedImage.thumbnail) setImageData(selectedImage.thumbnail);
    else if (typeof selectedImage === "string") setImageData(selectedImage);
  }, [selectedImage]);

  // ✅ base64 변환
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

  // ✅ 공용 API 호출
  const processImage = async (endpoint, extra = {}) => {
    if (!imageData) return alert("이미지를 먼저 선택해주세요!");
    setLoading(true);

    try {
      const formData = new FormData();

      if (imageData instanceof File) {
        formData.append("image", imageData);
      } else if (typeof imageData === "string") {
        const cleanBase64 = imageData.replace(/^data:image\/(png|jpeg);base64,/, "");
        const byteCharacters = atob(cleanBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
        formData.append("image", blob, "image.png");
      }

      for (const [k, v] of Object.entries(extra)) formData.append(k, v);

      const res = await fetch(`/api/${endpoint}`, { method: "POST", body: formData });
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
    if (!imageData) return alert("이미지를 먼저 선택해주세요!");
    if (!resizeW) return alert("가로(px)를 입력하세요!");

    let width = parseInt(resizeW, 10);
    let height = resizeH;

    if (aspectRatio && !resizeH) {
      height = Math.round(width / aspectRatio);
    }

    await processImage("resize", { width, height });
  };

  // ✅ 비율 계산
  useEffect(() => {
    if (imageData instanceof File) {
      const img = new Image();
      img.onload = () => setAspectRatio(img.width / img.height);
      img.src = URL.createObjectURL(imageData);
    }
  }, [imageData]);

  // ✅ 키워드 분석
  const handleAnalyze = async () => {
    if (!imageData) return alert("이미지를 먼저 선택해주세요!");
    setLoading(true);

    try {
      const blob =
        imageData instanceof File
          ? imageData
          : await fetch(`data:image/png;base64,${imageData}`).then((r) => r.blob());
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
    if (!keywords.length) return;
    navigator.clipboard.writeText(keywords.join(", "));
    alert("키워드가 복사되었습니다 ✅");
  };

  return (
    <div className="tools-wrap">
      <h3>🧩 추가 기능</h3>

      {/* 🔹 리사이즈 */}
      <div className="tool-block">
        <label>가로(px)</label>
        <input
          type="number"
          className="input"
          placeholder="예: 800"
          value={resizeW}
          onChange={(e) => setResizeW(e.target.value)}
        />
        <button className="btn" onClick={handleResize} disabled={loading}>
          자동 리사이즈
        </button>
      </div>

      {/* 🔹 SVG 변환 (색상 선택 추가) */}
      <div className="tool-block">
        <label>SVG 변환</label>
        <select
          className="input"
          value={svgColors}
          onChange={(e) => setSvgColors(e.target.value)}
        >
          <option value="1">단색</option>
          <option value="2">2색</option>
          <option value="3">3색</option>
          <option value="4">4색</option>
          <option value="5">5색</option>
          <option value="6">6색</option>
        </select>
        <button
          className="btn"
          onClick={() => processImage("convert-svg", { colors: svgColors })}
          disabled={loading}
        >
          SVG 변환
        </button>
      </div>

      {/* 🔹 GIF 변환 (설명 입력 추가) */}
      <div className="tool-block">
        <label>GIF 변환</label>
        <textarea
          className="input"
          placeholder="GIF 동작 설명을 입력하세요"
          value={gifDesc}
          onChange={(e) => setGifDesc(e.target.value)}
        />
        <button
          className="btn"
          onClick={() => processImage("convert-gif", { desc: gifDesc })}
          disabled={loading}
        >
          GIF 변환
        </button>
      </div>

      {/* 🔹 키워드 분석 */}
      <div className="tool-block">
        <label>키워드 분석</label>
        <button className="btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? "분석 중..." : "키워드 분석"}
        </button>

        <textarea
          className="input"
          value={keywords.join(", ")}
          readOnly
          placeholder="분석 결과가 여기에 표시됩니다."
        />
        {keywords.length > 0 && (
          <button className="btn" onClick={copyKeywords}>
            복사
          </button>
        )}
      </div>
    </div>
  );
}
