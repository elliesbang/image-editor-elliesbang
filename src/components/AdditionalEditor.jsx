import React, { useState } from "react";

function AdditionalEditor({ selectedUploadImage, selectedResultImage }) {
  const [resizeW, setResizeW] = useState("");
  const [svgColors, setSvgColors] = useState(1);
  const [gifNote, setGifNote] = useState("");
  const [keywords, setKeywords] = useState([]);

  // ✅ blob → base64 변환
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

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
      const base64 = await blobToBase64(blob);

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      const data = await res.json();
      console.log("🔍 키워드 분석 결과:", data);
      setKeywords(data.keywords || []);
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
    </div>
  );
}

export default AdditionalEditor;
