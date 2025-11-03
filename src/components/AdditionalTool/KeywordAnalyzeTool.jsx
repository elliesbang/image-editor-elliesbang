// /src/components/Tools/KeywordAnalyzeTool.jsx
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
  const [perImage, setPerImage] = useState([]); // [{index, title, keywords, uniqueKeywords}]

  // 활성 소스: 여러 장 우선
  const activeList =
    (Array.isArray(selectedImages) && selectedImages.length > 0 && selectedImages) ||
    [selectedResultImage || selectedUploadImage || selectedImage].filter(Boolean);

  const hasActive = activeList.length > 0;

  const handleAnalyze = async () => {
    if (!hasActive) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);
    try {
      // 여러 장을 base64 배열로 준비
      const imageBase64List = [];
      for (const item of activeList) {
        const src = getCurrentImage(item);
        const blob =
          src instanceof File
            ? src
            : await fetch(src.startsWith("data:image") ? src : `data:image/png;base64,${src}`).then((r) => r.blob());
        const b64 = await blobToBase64(blob);
        imageBase64List.push(b64);
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64List }),
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "분석 실패");

      setTitle(data.title || "분석 결과");
      setCommon(Array.isArray(data.commonKeywords) ? data.commonKeywords : []);
      setPerImage(Array.isArray(data.perImage) ? data.perImage : []);
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

      {(common.length > 0 || perImage.length > 0) && (
        <div className="keyword-result" style={{ marginTop: 12 }}>
          {/* 대표 제목 */}
          <div className="result-line" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <strong>제목:</strong>
            <span>{title}</span>
            <button className="copy-btn" title="제목 복사" onClick={() => copyText(title, "제목")}>📋</button>
          </div>

          {/* 공통 키워드 */}
          {common.length > 0 && (
            <div className="result-line" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 8 }}>
              <strong>공통 키워드:</strong>
              <span>{common.join(", ")}</span>
              <button
                className="copy-btn"
                title="공통 키워드 복사"
                onClick={() => copyText(common.join(", "), "공통 키워드")}
              >
                📋
              </button>
            </div>
          )}

          {/* 개별 키워드(각 이미지) */}
          {perImage.map((p, idx) => (
            <div key={idx} style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #eee" }}>
              <div className="result-line" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <strong>이미지 {p.index + 1} 제목:</strong>
                <span>{p.title}</span>
                <button
                  className="copy-btn"
                  title={`이미지 ${p.index + 1} 제목 복사`}
                  onClick={() => copyText(p.title, `이미지 ${p.index + 1} 제목`)}
                >
                  📋
                </button>
              </div>

              <div className="result-line" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                <strong>키워드(25):</strong>
                <span>{(p.keywords || []).join(", ")}</span>
                <button
                  className="copy-btn"
                  title={`이미지 ${p.index + 1} 키워드 복사`}
                  onClick={() => copyText((p.keywords || []).join(", "), `이미지 ${p.index + 1} 키워드`)}
                >
                  📋
                </button>
              </div>

              {(p.uniqueKeywords || []).length > 0 && (
                <div className="result-line" style={{ display: "flex", gap: 8, alignItems: "center", marginTop: 6 }}>
                  <strong>개별 유니크:</strong>
                  <span>{p.uniqueKeywords.join(", ")}</span>
                  <button
                    className="copy-btn"
                    title={`이미지 ${p.index + 1} 유니크 키워드 복사`}
                    onClick={() => copyText(p.uniqueKeywords.join(", "), `이미지 ${p.index + 1} 유니크 키워드`)}
                  >
                    📋
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
