import React, { useState } from "react";

function AdditionalEditor({ selectedUploadImage, selectedResultImage }) {
  const [resizeW, setResizeW] = useState("");
  const [svgColors, setSvgColors] = useState(1);
  const [gifNote, setGifNote] = useState("");
  const [keywords, setKeywords] = useState([]);

  // ✅ 대상 이미지 선택 (업로드 or 처리결과)
  const getImageURL = () => {
    if (selectedUploadImage?.file)
      return URL.createObjectURL(selectedUploadImage.file);
    if (typeof selectedResultImage === "string")
      return `data:image/png;base64,${selectedResultImage}`;
    return null;
  };

  const imgSrc = getImageURL();

  // ✅ 리사이즈
  const handleResize = () => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
    if (!resizeW) return alert("가로 크기를 입력하세요!");

    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const aspect = img.height / img.width;
      const newW = parseInt(resizeW, 10);
      const newH = Math.round(newW * aspect);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      canvas.width = newW;
      canvas.height = newH;
      ctx.drawImage(img, 0, 0, newW, newH);

      // ✅ base64로 변환 후 ProcessResult로 전달
      const base64 = canvas.toDataURL("image/png").split(",")[1];
      const blob = dataURLtoBlob(canvas.toDataURL("image/png"));
      const resizedFile = new File([blob], "resized.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file: resizedFile, thumbnail: base64 },
        })
      );

      alert(`리사이즈 완료! ${newW} × ${newH}px`);
    };
  };

  // ✅ base64 → Blob 변환 유틸
  const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new Blob([u8arr], { type: mime });
  };

  // ✅ 키워드 분석
  const handleAnalyze = async () => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const file = new File([blob], "target.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/analyze", { method: "POST", body: formData });
      const data = await res.json();

      console.log("🔍 키워드 분석 결과:", data);

      const translateTable = {
        flower: "꽃", sky: "하늘", tree: "나무", person: "사람",
        people: "사람들", water: "물", cloud: "구름", building: "건물",
        city: "도시", mountain: "산", car: "자동차", dog: "강아지",
        cat: "고양이", food: "음식", plant: "식물", bird: "새",
        sun: "태양", sunset: "노을", forest: "숲", sea: "바다",
        light: "빛", art: "예술", picture: "그림", color: "색상", paper: "종이",
      };

      const raw = (data.keywords || data.tags || data.labels || []).slice(0, 25);
      const koreanOnly = raw.map((k) => translateTable[k] || k).filter(Boolean);

      setKeywords(koreanOnly);
    } catch (err) {
      console.error("❌ 분석 오류:", err);
      alert("분석 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="tools-wrap">

      {/* ✅ 리사이즈 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">리사이즈</label>
          <input
            className="input"
            type="number"
            placeholder="가로(px)"
            value={resizeW}
            onChange={(e) => setResizeW(e.target.value)}
          />
        </div>
        <div className="row-right">
          <button className="btn" onClick={handleResize}>
            리사이즈
          </button>
        </div>
      </div>

      {/* ✅ 키워드 분석 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">키워드 분석</label>
          {keywords.length > 0 ? (
            <div className="hint-box">{keywords.join(", ")}</div>
          ) : (
            <p style={{ color: "#999", fontSize: "0.9rem" }}>분석 결과가 여기에 표시됩니다.</p>
          )}
        </div>
        <div className="row-right">
          <button className="btn" onClick={handleAnalyze}>
            키워드 분석
          </button>
        </div>
      </div>

      {/* ✅ SVG 변환 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">SVG 변환</label>
          <select
            className="select"
            value={svgColors}
            onChange={(e) => setSvgColors(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}색</option>
            ))}
          </select>
        </div>
        <div className="row-right">
          <button
            className="btn"
            onClick={async () => {
              if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
              try {
                const blob = await fetch(imgSrc).then((r) => r.blob());
                const file = new File([blob], "target.png", { type: "image/png" });
                const formData = new FormData();
                formData.append("image", file);
                formData.append("colors", svgColors);
                const res = await fetch("/api/svg", { method: "POST", body: formData });
                if (!res.ok) throw new Error(`SVG 변환 실패 (${res.status})`);
                const blobRes = await res.blob();
                const url = URL.createObjectURL(blobRes);
                window.open(url, "_blank");
              } catch (err) {
                console.error("SVG 변환 오류:", err);
                alert("SVG 변환 중 오류가 발생했습니다.");
              }
            }}
          >
            SVG 변환
          </button>
        </div>
      </div>

      {/* ✅ GIF 변환 */}
      <div className="tool-row">
        <div className="row-left">
          <label className="row-label">GIF 변환</label>
          <textarea
            className="textarea"
            rows={2}
            placeholder="예: 3프레임, 좌→우 흔들림"
            value={gifNote}
            onChange={(e) => setGifNote(e.target.value)}
          />
        </div>
        <div className="row-right">
          <button
            className="btn"
            onClick={async () => {
              if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
              try {
                const blob = await fetch(imgSrc).then((r) => r.blob());
                const file = new File([blob], "target.png", { type: "image/png" });
                const formData = new FormData();
                formData.append("image", file);
                formData.append("note", gifNote);
                const res = await fetch("/api/gif", { method: "POST", body: formData });
                if (!res.ok) throw new Error(`GIF 변환 실패 (${res.status})`);
                const blobRes = await res.blob();
                const url = URL.createObjectURL(blobRes);
                window.open(url, "_blank");
              } catch (err) {
                console.error("GIF 변환 오류:", err);
                alert("GIF 변환 중 오류가 발생했습니다.");
              }
            }}
          >
            GIF 변환
          </button>
        </div>
      </div>
    </div>
  );
}

export default AdditionalEditor;
