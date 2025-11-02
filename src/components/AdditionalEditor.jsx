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

      {/* 키워드 분석: 왼쪽 '키워드 분석' 버튼, 오른쪽 '복사' 버튼 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">키워드 분석</label>
          <button className="btn ghost" disabled={disabled}
            onClick={()=>setKeywords("예: soft watercolor, spring forest, gentle light")}>
            키워드 분석
          </button>
        </div>
        <div className="row-right">
          <button className="btn" disabled={!keywords}
            onClick={() => navigator.clipboard.writeText(keywords)}>
            분석 결과 복사
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
