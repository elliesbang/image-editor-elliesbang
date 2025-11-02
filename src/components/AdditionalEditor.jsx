import React, { useState } from "react";

function AdditionalEditor({ selectedImage }) {
  const [resizeW, setResizeW] = useState("");
  const [resizeH, setResizeH] = useState("");
  const [svgColors, setSvgColors] = useState(1);
  const [gifNote, setGifNote] = useState("");
  const [keywords, setKeywords] = useState("");

  const disabled = !selectedImage;

  return (
    <div className="tools-wrap">

      {/* 리사이즈: 왼쪽 입력, 오른쪽 버튼 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">리사이즈</label>
          <div className="row-fields">
            <input className="input" type="number" placeholder="가로(px)" value={resizeW} onChange={(e)=>setResizeW(e.target.value)} />
            <span className="xmark">×</span>
            <input className="input" type="number" placeholder="세로(px)" value={resizeH} onChange={(e)=>setResizeH(e.target.value)} />
          </div>
        </div>
        <div className="row-right">
          <button className="btn" disabled={disabled}>리사이즈</button>
        </div>
      </div>

    {/* 키워드 분석: 한글 결과 + 아이콘 복사 + 자동 제목 */}
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

    {/* 🔸 분석 결과 (한글만, 쉼표로 구분) */}
    <div className="row-fields">
      {keywords.length > 0 ? (
        <div className="hint-box">{keywords.join(", ")}</div>
      ) : (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>
          분석 결과가 여기에 표시됩니다.
        </p>
      )}
    </div>

    {/* 🔹 자동 제목 */}
    {keywords.length > 0 && (
      <div
        style={{
          marginTop: "6px",
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
        if (!selectedImage) {
          alert("이미지를 먼저 선택하세요!");
          return;
        }
        try {
          const formData = new FormData();
          formData.append("image", selectedImage.file);
          const res = await fetch("/api/analyze", { method: "POST", body: formData });
          const data = await res.json();

          const translateTable = {
            flower: "꽃",
            sky: "하늘",
            tree: "나무",
            person: "사람",
            people: "사람들",
            water: "물",
            cloud: "구름",
            building: "건물",
            city: "도시",
            mountain: "산",
            car: "자동차",
            dog: "강아지",
            cat: "고양이",
            food: "음식",
            plant: "식물",
            bird: "새",
            sun: "태양",
            sunset: "노을",
            forest: "숲",
            sea: "바다",
            light: "빛",
            art: "예술",
            picture: "그림",
            color: "색상",
            paper: "종이",
          };

          const raw = (data.keywords || []).slice(0, 25);
          const koreanOnly = raw
            .map((k) => translateTable[k] || "")
            .filter((v) => v);

          setKeywords(koreanOnly);
        } catch (err) {
          console.error(err);
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
