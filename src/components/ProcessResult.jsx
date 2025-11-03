import React, { useState, useEffect } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

export default function ProcessResult({ results, setSelectedResult }) {
  const initialResults = Array.isArray(results) ? results : [];
  const [selectedResults, setSelectedResults] = useState([]);
  const [localResults, setLocalResults] = useState(initialResults);

  // ✅ 새로 처리된 결과 자동 반영 (배경제거·크롭·노이즈·리사이즈 등)
  useEffect(() => {
    const handleProcessed = (e) => {
      const { file, thumbnail, result } = e.detail || {};
      const base64Data = result || thumbnail;

      // ✅ 파일 객체 → Base64 변환
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          const cleanBase64 = reader.result.replace(/^data:image\/\w+;base64,/, "");
          setLocalResults((prev) => [...prev, cleanBase64]);
        };
        reader.readAsDataURL(file);
      }
      // ✅ Base64 문자열인 경우
      else if (base64Data) {
        const cleanBase64 = base64Data.replace(/^data:image\/\w+;base64,/, "");
        setLocalResults((prev) => [...prev, cleanBase64]);
      }
    };

    window.addEventListener("imageProcessed", handleProcessed);
    return () => window.removeEventListener("imageProcessed", handleProcessed);
  }, []);

  // ✅ 외부 results 변경 시 동기화
  useEffect(() => {
    if (Array.isArray(results)) {
      setLocalResults(results);
    }
  }, [results]);

  const getImageSrc = (img) =>
    img.startsWith("data:image") ? img : `data:image/png;base64,${img}`;

  // ✅ 이미지 선택 / 해제
  const toggleSelect = (img) => {
    let newSelection;
    if (selectedResults.includes(img)) {
      newSelection = [];
      setSelectedResult?.(null);
    } else {
      newSelection = [img];
      setSelectedResult?.(getImageSrc(img));
    }
    setSelectedResults(newSelection);
  };

  // ✅ 전체 선택 / 해제 / 삭제
  const handleSelectAll = () => {
    setSelectedResults([...localResults]);
    if (localResults.length > 0) {
      setSelectedResult?.(getImageSrc(localResults[0]));
    }
  };

  const handleDeselectAll = () => {
    setSelectedResults([]);
    setSelectedResult?.(null);
  };

  const handleDeleteAll = () => {
    if (window.confirm("모든 이미지를 삭제하시겠습니까?")) {
      setLocalResults([]);
      setSelectedResults([]);
      setSelectedResult?.(null);
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
      {localResults.length > 0 && (
        <div className="control-buttons">
          <button onClick={handleSelectAll}>전체 선택</button>
          <button onClick={handleDeselectAll}>전체 해제</button>
          <button onClick={handleDeleteAll}>전체 삭제</button>
        </div>
      )}

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
                💾
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
