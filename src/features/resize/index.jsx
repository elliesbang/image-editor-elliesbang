import React, { useMemo, useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchResult, loadImage, toBase64 } from "../shared/utils";

export default function ResizeTool({
  selectedImage,
  selectedImages = [],
  selectedResultImage,
  selectedResultImages = [],
}) {
  const [resizeWidth, setResizeWidth] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [loading, setLoading] = useState(false);

  const activeImages = useMemo(() => {
    if (Array.isArray(selectedImages) && selectedImages.length > 0) {
      return selectedImages;
    }
    if (
      Array.isArray(selectedResultImages) &&
      selectedResultImages.length > 0
    ) {
      return selectedResultImages;
    }
    return [selectedResultImage || selectedImage].filter(Boolean);
  }, [
    selectedImages,
    selectedImage,
    selectedResultImage,
    selectedResultImages,
  ]);

  const hasSelection = activeImages.length > 0;

  const handleResize = async () => {
    if (!resizeWidth) {
      alert("가로(px)를 입력하세요!");
      return;
    }

    if (!hasSelection) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    const targetWidth = parseInt(resizeWidth, 10);
    if (Number.isNaN(targetWidth) || targetWidth <= 0) {
      alert("유효한 가로(px)를 입력하세요!");
      return;
    }

    setLoading(true);

    try {
      const results = await Promise.all(
        activeImages.map(async (image) => {
          const src = await toBase64(image);
          if (!src) return null;

          const loaded = await loadImage(src);
          const aspect = loaded.naturalWidth / loaded.naturalHeight;
          const newHeight = keepAspect
            ? Math.round(targetWidth / aspect)
            : loaded.naturalHeight;

          const canvas = document.createElement("canvas");
          canvas.width = targetWidth;
          canvas.height = newHeight;

          const ctx = canvas.getContext("2d");
          ctx.drawImage(loaded, 0, 0, targetWidth, newHeight);

          const dataUrl = canvas.toDataURL("image/png");
          dispatchResult(dataUrl, `리사이즈 (${targetWidth}×${newHeight})`, {
            meta: { width: targetWidth, height: newHeight },
          });

          return dataUrl;
        })
      );

      const successCount = results.filter(Boolean).length;
      if (successCount > 0) {
        alert(ALERT_MESSAGES.RESIZE_DONE(successCount));
      }
    } catch (error) {
      console.error("리사이즈 오류", error);
      alert("리사이즈 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-row">
      <label>리사이즈</label>
      <input
        type="number"
        className="input"
        placeholder="가로(px)"
        value={resizeWidth}
        onChange={(e) => setResizeWidth(e.target.value)}
      />

      <label className="checkbox-label" style={{ marginLeft: "10px" }}>
        <input
          type="checkbox"
          checked={keepAspect}
          onChange={(e) => setKeepAspect(e.target.checked)}
        />
        비율 유지
      </label>

      <button
        className="btn"
        onClick={handleResize}
        disabled={loading || !hasSelection}
      >
        {loading ? "리사이즈 중..." : "리사이즈 실행"}
      </button>
    </div>
  );
}
