import React, { useState } from "react";
import { getCurrentImage } from "./utils";

export default function ResizeTool({
  selectedImage,
  selectedImages,
  setSelectedImages,
  selectedUploadImage,
  selectedResultImage,
}) {
  const [resizeW, setResizeW] = useState("");
  const [keepAspect, setKeepAspect] = useState(true);
  const [loading, setLoading] = useState(false);

  // ✅ 다중/단일 활성 이미지 판단
  const activeList =
    (Array.isArray(selectedImages) && selectedImages.length > 0 && selectedImages) ||
    [selectedResultImage || selectedUploadImage || selectedImage].filter(Boolean);
  const hasActive = activeList.length > 0;

  const handleResize = async () => {
    if (!resizeW) return alert("가로(px)를 입력하세요!");
    if (!hasActive) return alert("리사이즈할 이미지를 선택하세요!");

    setLoading(true);

    try {
      const newW = parseInt(resizeW);

      // ✅ 여러 장 순차 처리
      for (const item of activeList) {
        const currentImage = getCurrentImage(item);
        if (!currentImage) continue;

        const img = new Image();
        img.src =
          typeof currentImage === "string"
            ? currentImage
            : URL.createObjectURL(currentImage);

        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
        });

        const aspect = img.width / img.height;
        const newH = keepAspect ? Math.round(newW / aspect) : img.height;

        const canvas = document.createElement("canvas");
        canvas.width = newW;
        canvas.height = newH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, newW, newH);

        const base64 = canvas
          .toDataURL("image/png")
          .replace(/^data:image\/png;base64,/, "");
        const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
        const file = new File([blob], "resized.png", { type: "image/png" });

        // ✅ 처리결과 섹션으로 개별 전달
        window.dispatchEvent(
          new CustomEvent("imageProcessed", {
            detail: {
              file,
              thumbnail: `data:image/png;base64,${base64}`,
              meta: { width: newW, height: newH, label: "리사이즈" },
            },
          })
        );
      }

      alert("✅ 모든 이미지 리사이즈 완료!");
    } catch (err) {
      console.error("🚨 리사이즈 오류:", err);
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
        value={resizeW}
        onChange={(e) => setResizeW(e.target.value)}
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
        disabled={loading || !hasActive}
      >
        {loading ? "리사이즈 중..." : "리사이즈 실행"}
      </button>
    </div>
  );
}
