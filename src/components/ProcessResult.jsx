import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ProcessResult({ results = [], setSelectedResult }) {
  const [selectedResults, setSelectedResults] = useState([]);
  const [localResults, setLocalResults] = useState(results);

  // ✅ 새로 처리된 결과 자동 반영 (배경제거·크롭·노이즈)
  useEffect(() => {
    const handleProcessed = (e) => {
      const { file, thumbnail, result } = e.detail;
      const base64Data = result || thumbnail;

      if (base64Data) {
        setLocalResults((prev) => [...prev, base64Data]);
      } else if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = reader.result.split(",")[1];
          setLocalResults((prev) => [...prev, base64]);
        };
        reader.readAsDataURL(file);
      }
    };

    window.addEventListener("imageProcessed", handleProcessed);
    return () => window.removeEventListener("imageProcessed", handleProcessed);
  }, []);

  // ✅ App에서 전달된 results 동기화
  useEffect(() => setLocalResults(results), [results]);

  const getImageSrc = (img) => {
    if (img.startsWith("data:image")) return img;
    return `data:image/png;base64,${img}`;
  };

  // ✅ 이미지 선택 / 해제
  const toggleSelect = (img) => {
    let newSelection;
    if (selectedResults.includes(img)) {
      newSelection = [];
      if (setSelectedResult) setSelectedResult(null);
    } else {
      newSelection = [img];
      if (setSelectedResult) setSelectedResult(getImageSrc(img));
    }
    setSelectedResults(newSelection);
  };

  // ✅ 전체 선택 / 해제 / 삭제
  const handleSelectAll = () => {
    setSelectedResults([...localResults]);
    if (setSelectedResult && localResults.length > 0) {
      setSelectedResult(getImageSrc(localResults[0]));
    }
  };

  const handleDeselectAll = () => {
    setSelectedResults([]);
    if (setSelectedResult) setSelectedResult(null);
  };

  const handleDeleteAll = () => {
    if (window.confirm("모든 이미지를 삭제하시겠습니까?")) {
      setLocalResults([]);
      setSelectedResults([]);
      if (setSelectedResult) setSelectedResult(null);
    }
  };

  // ✅ 개별 다운로드
  const handleDownload = (base64, index) => {
    const link = document.createElement("a");
    link.href = getImageSrc(base64);
    link.download = `result_${index + 1}.png`;
    link.click();
  };

  // ✅ 전체 ZIP 다운로드
  const handleDownloadAll = async () => {
    if (localResults.length === 0) return alert("저장할 이미지가 없습니다!");
    const zip = new JSZip();

    localResults.forEach((base64, idx) => {
      const cleanBase64 = base64.replace(/^data:image\/png;base64,/, "");
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: "image/png" });
      zip.file(`result_${idx + 1}.png`, blob);
    });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, "elliesbang_results.zip");
  };

  return (
    <div className="result-section">
      {/* ✅ 제어 버튼 */}
      {localResults.length > 0 && (
        <div className="control-buttons">
          <button onClick={handleSelectAll}>전체 선택</button>
          <button onClick={handleDeselectAll}>전체 해제</button>
          <button onClick={handleDeleteAll}>전체 삭제</button>
        </div>
      )}

      {/* ✅ 결과 썸네일 */}
      <div className="thumbnail-grid">
        {localResults.length === 0 ? (
          <p className="empty">아직 처리된 이미지가 없습니다.</p>
        ) : (
          localResults.map((img, idx) => (
            <div
              key={idx}
              className={`thumb-wrapper ${
                selectedResults.includes(img) ? "selected" : ""
              }`}
              onClick={() => toggleSelect(img)}
            >
              <img src={getImageSrc(img)} alt={`결과 ${idx + 1}`} className="thumb" />
              <button
                className="save-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(img, idx);
                }}
              >
                저장
              </button>
            </div>
          ))
        )}
      </div>

      {localResults.length > 0 && (
        <div className="download-all-wrapper">
          <button onClick={handleDownloadAll}>전체 다운로드</button>
        </div>
      )}
    </div>
  );
}
