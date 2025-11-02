import React, { useState } from "react";

function AdditionalEditor({ selectedUploadImage, selectedResultImage }) {
  const [resizeW, setResizeW] = useState("");
  const [svgColors, setSvgColors] = useState(1);
  const [gifNote, setGifNote] = useState("");
  const [keywords, setKeywords] = useState("");

  // ✅ 업로드 or 처리결과 중 하나라도 선택되어 있으면 버튼 활성화
  const targetImage = selectedUploadImage || selectedResultImage;
  const disabled = !targetImage;

  return (
    <div className="tools-wrap">
      {/* 리사이즈 */}
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

              const img = new Image();
              img.src = URL.createObjectURL(targetImage.file || targetImage);

              img.onload = () => {
                const aspect = img.height / img.width;
                const newW = parseInt(resizeW, 10);
                const newH = Math.round(newW * aspect);

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

                  window.dispatchEvent(
                    new CustomEvent("imageProcessed", {
                      detail: { file: resizedFile, thumbnail: url },
                    })
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

          {keywords.length > 0 ? (
            <div className="hint-box" style={{ marginBottom: "10px" }}>
              {keywords.join(", ")}
            </div>
          ) : (
            <p style={{ color: "#999", fontSize: "0.9rem", marginBottom: "8px" }}>
              분석 결과가 여기에 표시됩니다.
            </p>
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
                const res = await fetch("/api/analyze", {
                  method: "POST",
                  body: formData,
                });
                const data = await res.json();

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
    </div>
  );
}

export default AdditionalEditor;
