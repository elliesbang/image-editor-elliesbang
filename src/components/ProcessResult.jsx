import React, { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { saveAs } from "file-saver";

const ensureDataUrl = (value) => {
  if (!value) return "";
  return value.startsWith("data:image") ? value : `data:image/png;base64,${value}`;
};

const stripDataUrlPrefix = (value = "") =>
  value.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, "");

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const loadDimensions = (src) =>
  new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => resolve({});
    image.src = src;
  });

const normalizeResultItem = (item) => {
  if (!item) return null;

  if (typeof item === "string") {
    return { id: generateId(), src: ensureDataUrl(item), meta: {} };
  }

  if (typeof item === "object") {
    const srcCandidate =
      item.src || item.base64 || item.thumbnail || item.result || "";
    if (!srcCandidate) return null;
    return {
      id: item.id || generateId(),
      src: ensureDataUrl(srcCandidate),
      meta: item.meta || {},
    };
  }

  return null;
};

export default function ProcessResult({ images, results, setSelectedResult }) {
  const getInitialResults = () => {
    const source = Array.isArray(results)
      ? results
      : Array.isArray(images)
      ? images
      : [];
    return source.map((item) => normalizeResultItem(item)).filter(Boolean);
  };

  const [selectedResults, setSelectedResults] = useState([]);
  const [localResults, setLocalResults] = useState(getInitialResults);

  const addResult = useCallback(
    async (src, meta = {}) => {
      if (!src) return;
      const normalizedSrc = ensureDataUrl(src);
      const needsDimensions = !meta.width || !meta.height;
      const dimensions = needsDimensions
        ? await loadDimensions(normalizedSrc)
        : {};

      setLocalResults((prev) => [
        ...prev,
        {
          id: generateId(),
          src: normalizedSrc,
          meta: { ...dimensions, ...meta },
        },
      ]);
    },
    [setLocalResults]
  );

  // ✅ 새로 처리된 결과 자동 반영 (배경제거·크롭·노이즈·리사이즈 등)
  useEffect(() => {
    const handleProcessed = (e) => {
      const { file, thumbnail, result, meta } = e.detail || {};
      const base64Data = result || thumbnail;

      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          addResult(reader.result, meta);
        };
        reader.readAsDataURL(file);
      } else if (base64Data) {
        addResult(base64Data, meta);
      }
    };

    window.addEventListener("imageProcessed", handleProcessed);
    return () => window.removeEventListener("imageProcessed", handleProcessed);
  }, [addResult]);

  // ✅ 외부 results 변경 시 동기화 (초기 전달 및 별도 결과 배열 사용 시)
  useEffect(() => {
    if (Array.isArray(results)) {
      setLocalResults(
        results.map((item) => normalizeResultItem(item)).filter(Boolean)
      );
    } else if (!Array.isArray(results) && Array.isArray(images)) {
      setLocalResults((prev) =>
        prev.length > 0
          ? prev
          : images.map((item) => normalizeResultItem(item)).filter(Boolean)
      );
    }
  }, [results, images]);

  // ✅ 이미지 선택 / 해제
  const toggleSelect = (entry) => {
    if (!entry) return;

    if (selectedResults.includes(entry.id)) {
      setSelectedResults([]);
      setSelectedResult?.(null);
    } else {
      setSelectedResults([entry.id]);
      setSelectedResult?.(entry.src);
    }
  };

  // ✅ 전체 선택 / 해제 / 삭제
  const handleSelectAll = () => {
    const ids = localResults.map((item) => item.id);
    setSelectedResults(ids);
    if (localResults.length > 0) {
      setSelectedResult?.(localResults[0].src);
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
  const handleDownload = (entry, index) => {
    if (!entry) return;
    const link = document.createElement("a");
    link.href = entry.src;
    link.download = `result_${index + 1}.png`;
    link.click();
  };

  // ✅ 전체 ZIP 다운로드
  const handleDownloadAll = async () => {
    if (localResults.length === 0) return alert("저장할 이미지가 없습니다!");
    const zip = new JSZip();

    localResults.forEach((entry, idx) => {
      const cleanBase64 = stripDataUrlPrefix(entry.src);
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const blob = new Blob([new Uint8Array(byteNumbers)], {
        type: "image/png",
      });
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
          localResults.map((entry, idx) => (
            <div
              key={entry.id}
              className={`thumb-wrapper ${
                selectedResults.includes(entry.id) ? "selected" : ""
              }`}
              onClick={() => toggleSelect(entry)}
            >
              <img src={entry.src} alt={`결과 ${idx + 1}`} className="thumb" />
              {entry.meta?.width && entry.meta?.height && (
                <div className="thumb-meta">
                  {entry.meta.width}×{entry.meta.height}px
                  {entry.meta?.label ? ` · ${entry.meta.label}` : ""}
                </div>
              )}
              <button
                className="save-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(entry, idx);
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
