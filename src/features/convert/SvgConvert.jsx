import React, { useMemo, useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchResult } from "../shared/utils";
import { runSvgConvert } from "./worker";

const encodeSvgToDataUrl = (svg) => {
  if (!svg) return "";
  const encoded = btoa(
    encodeURIComponent(svg).replace(/%([0-9A-F]{2})/g, (_, code) =>
      String.fromCharCode(parseInt(code, 16))
    )
  );
  return `data:image/svg+xml;base64,${encoded}`;
};

export default function SvgConvert({
  selectedImages = [],
  selectedResults = [],
  selectedResultImage,
  selectedImage,
  disabled,
}) {
  const [maxColors, setMaxColors] = useState(6);
  const [loading, setLoading] = useState(false);

  const activeTargets = useMemo(() => {
    if (Array.isArray(selectedResults) && selectedResults.length > 0) {
      return selectedResults;
    }
    if (Array.isArray(selectedImages) && selectedImages.length > 0) {
      return selectedImages;
    }
    return [selectedResultImage || selectedImage].filter(Boolean);
  }, [selectedImage, selectedImages, selectedResultImage, selectedResults]);

  const hasSelection = activeTargets.length > 0;

  const handleSvgConvert = async () => {
    if (!hasSelection) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        activeTargets.map((image, index) =>
          runSvgConvert(image, { maxColors }).then(({ svg, blob }) => {
            const file = new File([blob], `vector_${index + 1}.svg`, {
              type: "image/svg+xml",
            });
            const dataUrl = encodeSvgToDataUrl(svg);
            dispatchResult(dataUrl, `SVG(${maxColors}색)`, { file });
            return dataUrl;
          })
        )
      );

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        alert(ALERT_MESSAGES.SVG_DONE(successCount));
      }
    } catch (error) {
      console.error("SVG 변환 오류", error);
      alert("SVG 변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-row">
      <label>SVG 색상수:</label>
      <select
        value={maxColors}
        onChange={(e) => setMaxColors(Number(e.target.value))}
        disabled={loading}
      >
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>
            {n}색
          </option>
        ))}
      </select>

      <button
        className="btn"
        onClick={handleSvgConvert}
        disabled={disabled || !hasSelection || loading}
      >
        {loading ? "SVG 변환 중..." : "SVG 변환 실행"}
      </button>
    </div>
  );
}
