import React, { useMemo, useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchResult } from "../shared/utils";
import { runGifConvert } from "./worker";

export default function GifConvert({
  selectedImages = [],
  selectedResults = [],
  selectedResultImage,
  selectedImage,
  disabled,
}) {
  const [loop, setLoop] = useState(true);
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

  const handleGifConvert = async () => {
    if (!hasSelection) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(
        activeTargets.map(async (image, index) => {
          const dataUrl = await runGifConvert(image, { loop });
          dispatchResult(dataUrl, "GIF 변환", { meta: { loop } });
          return dataUrl;
        })
      );

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        alert(ALERT_MESSAGES.GIF_DONE(successCount));
      }
    } catch (error) {
      console.error("GIF 변환 오류", error);
      alert("GIF 변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-row">
      <label>GIF 변환</label>

      <label style={{ marginLeft: "10px" }}>
        <input
          type="checkbox"
          checked={loop}
          onChange={(e) => setLoop(e.target.checked)}
        />
        반복 재생
      </label>

      <button
        className="btn"
        onClick={handleGifConvert}
        disabled={disabled || !hasSelection || loading}
      >
        {loading ? "GIF 변환 중..." : "GIF 변환 실행"}
      </button>
    </div>
  );
}
