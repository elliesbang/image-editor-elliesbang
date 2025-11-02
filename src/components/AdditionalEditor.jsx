import React, { useState } from "react";

function AdditionalEditor({ selectedImage, selectedResult }) {
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [svgColors, setSvgColors] = useState(1);
  const [gifNote, setGifNote] = useState("");
  const [keywords, setKeywords] = useState("");

  // ✅ 업로드 or 처리결과 중 하나라도 선택되어 있으면 버튼 활성화
  const targetImage = selectedImage || selectedResult;
  const disabled = !targetImage;

  return (
    <div className="tools-wrap">
      
{/* 리사이즈: 가로 입력 → 세로 자동 계산 */}
<div className="tool-row">
  <div className="row-left">
    <label className="row-label">리사이즈</label>
    <div className="row-fields">
      <input
        className="input"
        type="number"
        placeholder="가로(px)"
        value={resizeW}
        onChange={(e) => setResizeW(e.target.value)}
      />
    </div>
  </div>

  <div className="row-right">
    <button
      className="btn"
      disabled={disabled || !resizeW}
      onClick={() => {
        if (!targetImage || !resizeW) {
          alert("이미지를 선택하고 가로 크기를 입력하세요!");
          return;
        }

        // ✅ 원본 이미지 불러오기
        const img = new Image();
        img.src = URL.createObjectURL(targetImage.file || targetImage);

        img.onload = () => {
          const aspect = img.height / img.width;
          const newW = parseInt(resizeW, 10);
          const newH = Math.round(newW * aspect);

          // ✅ 리사이즈 수행 (Canvas)
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = newW;
          canvas.height = newH;
          ctx.drawImage(img, 0, 0, newW, newH);

          canvas.toBlob((blob) => {
            const resizedFile = new File([blob], "resized.png", {
              type: "image/png",
            });
            const url = URL.createObjectURL(resizedFile);

            // ✅ 처리결과 섹션으로 새 이미지 전달
            window.dispatchEvent(
              new CustomEvent("imageProcessed", { detail: { file: resizedFile, thumbnail: url } })
            );

            alert(`리사이즈 완료! ${newW} × ${newH}px`);
          }, "image/png");
        };
      }}
    >
      리사이즈
    </button>
  </div>
</div>

   {/* 키워드 분석 */}
<div className="tool-row">
  <div className="row-left">
    <div className="row-label">
      키워드 분석{" "}
      {keywords.length > 0 && (
        <button
          onClick={() => {
            navigator.clipboard.writeText(keywords.join(", "));
            alert("키워드가 복사되었습니다!");
          }}
          style={{
            border: "none",
            background: "transparent",
            cursor: "pointer",
            marginLeft: "6px",
            fontSize: "1.1rem",
          }}
          title="분석 결과 복사"
        >
          📋
        </button>
      )}
    </div>

    {/* 🔸 분석 결과 버튼 위로 이동 */}
    {keywords.length > 0 ? (
      <div className="hint-box" style={{ marginBottom: "10px" }}>
        {keywords.join(", ")}
      </div>
    ) : (
      <p style={{ color: "#999", fontSize: "0.9rem", marginBottom: "8px" }}>
        분석 결과가 여기에 표시됩니다.
      </p>
    )}

    {/* 🔹 자동 제목 */}
    {keywords.length > 0 && (
      <div
        style={{
          marginBottom: "10px",
          fontWeight: "600",
          color: "#333",
          fontSize: "0.95rem",
        }}
      >
        제목:{" "}
        {(() => {
          const titleSample = keywords.slice(0, 3);
          if (titleSample.length === 1) return `${titleSample[0]}`;
          if (titleSample.length === 2)
            return `${titleSample[0]}와 ${titleSample[1]}`;
          return `${titleSample[0]}, ${titleSample[1]}와 ${titleSample[2]}`;
        })()}
        의 풍경
      </div>
    )}

    <button
      className="btn ghost"
      disabled={disabled}
      onClick={async () => {
        if (!targetImage) {
          alert("이미지를 먼저 선택하세요!");
          return;
        }
        try {
          const formData = new FormData();
          formData.append("image", targetImage.file || targetImage);
          const res = await fetch("/api/analyze", { method: "POST", body: formData });
          const data = await res.json();

          // ✅ 키워드 변환 로직
          const translateTable = {
            flower: "꽃", sky: "하늘", tree: "나무", person: "사람",
            people: "사람들", water: "물", cloud: "구름", building: "건물",
            city: "도시", mountain: "산", car: "자동차", dog: "강아지",
            cat: "고양이", food: "음식", plant: "식물", bird: "새",
            sun: "태양", sunset: "노을", forest: "숲", sea: "바다",
            light: "빛", art: "예술", picture: "그림", color: "색상", paper: "종이",
          };

          const raw = (data.keywords || []).slice(0, 25);
          const koreanOnly = raw.map((k) => translateTable[k] || "").filter((v) => v);
          setKeywords(koreanOnly);
        } catch (err) {
          console.error("분석 오류:", err);
          alert("분석 중 오류가 발생했습니다.");
        }
      }}
    >
      키워드 분석
    </button>
  </div>
</div>

      {/* SVG: 드롭다운(단색~6색) + 버튼 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">SVG 변환</label>
          <select className="select" value={svgColors} onChange={(e)=>setSvgColors(Number(e.target.value))}>
            <option value={1}>단색</option>
            <option value={2}>2색</option>
            <option value={3}>3색</option>
            <option value={4}>4색</option>
            <option value={5}>5색</option>
            <option value={6}>6색</option>
          </select>
        </div>
        <div className="row-right">
          <button className="btn" disabled={disabled}>SVG 변환</button>
        </div>
      </div>

      {/* GIF: 설명 박스 + 버튼 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">GIF 변환</label>
          <textarea className="textarea" rows={2}
            placeholder="동작 설명(예: 3프레임, 좌→우로 살짝 흔들림)"
            value={gifNote} onChange={(e)=>setGifNote(e.target.value)} />
        </div>
        <div className="row-right">
          <button className="btn" disabled={disabled}>GIF 변환</button>
        </div>
      </div>

      {/* 키워드 미리보기(선택) */}
      {keywords && <div className="hint-box">분석 결과: {keywords}</div>}
    </div>
  );
}

export default AdditionalEditor;
