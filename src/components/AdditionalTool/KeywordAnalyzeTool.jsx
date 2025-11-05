import React, { useState } from "react";
import { getCurrentImage, blobToBase64 } from "./utils";

export default function KeywordAnalyzeTool({
  selectedImage,
  selectedImages,
  selectedUploadImage,
  selectedResultImage,
}) {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [common, setCommon] = useState([]);
  const [perImage, setPerImage] = useState([]);

  // ✅ 선택된 이미지 (1장만 분석)
  const activeImage =
    selectedResultImage || selectedUploadImage || selectedImage ||
    (Array.isArray(selectedImages) && selectedImages.length > 0 && selectedImages[0]);

  const hasActive = !!activeImage;

  const handleAnalyze = async () => {
    if (!hasActive) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);
    try {
      // ✅ 선택된 이미지 base64로 변환
      const src = getCurrentImage(activeImage);
      const blob =
        src instanceof File
          ? src
          : await fetch(src.startsWith("data:image") ? src : `data:image/png;base64,${src}`).then((r) => r.blob());
      const imageBase64 = await blobToBase64(blob);

      // ✅ 서버에 단일 이미지 전달
     const res = await fetch("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ imageBase64List }),
});

const data = await res.json();
console.log("✅ 분석 결과:", data); // ✅ 여기에 추가

if (!data.success) throw new Error(data.error || "분석 실패");


      // ✅ 서버 응답 결과 반영
      setTitle("키워드 분석 결과");
      if (typeof data.result === "string") {
        setCommon(data.result.split(",").map((k) => k.trim()));
      } else if (Array.isArray(data.result)) {
        setCommon(data.result);
      }
    } catch (e) {
      console.error("키워드 분석 오류:", e);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const copyText = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert(`${label} 복사 완료 ✅`);
  };

  return (
    <div className="tool-block">
      <label>키워드 분석</label>
      <button className="btn" onClick={handleAnalyze} disabled={loading || !hasActive}>
        {loading ? "분석 중..." : "키워드 분석"}
      </button>

      {common.length > 0 && (
        <div className="keyword-result" style={{ marginTop: 12 }}>
          <div
            className="result-line"
            style={{ display: "flex", gap: 8, alignItems: "center" }}
          >
            <strong>제목:</strong>
            <span>{title}</span>
            <button
              className="copy-btn"
              title="제목 복사"
              onClick={() => copyText(title, "제목")}
            >
              📋
            </button>
          </div>

          <div
            className="result-line"
            style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}
          >
            <strong>키워드:</strong>
            <span>{common.join(", ")}</span>
            <button
              className="copy-btn"
              title="키워드 복사"
              onClick={() => copyText(common.join(", "), "키워드")}
            >
              📋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
