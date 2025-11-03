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

  const activeImage =
    selectedResultImage ||
    selectedUploadImage ||
    selectedImage ||
    (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  const handleResize = async () => {
    if (!resizeW) return alert("가로(px)를 입력하세요!");
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");

    setLoading(true);

    try {
      // ✅ 이미지 객체 로드
      const img = new Image();
      img.src =
        typeof currentImage === "string"
          ? currentImage
          : URL.createObjectURL(currentImage);

      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
      });

      // ✅ 비율 계산
      const aspect = img.width / img.height;
      const newW = parseInt(resizeW);
      const newH = keepAspect ? Math.round(newW / aspect) : img.height;

      // ✅ Canvas로 리사이즈
      const canvas = document.createElement("canvas");
      canvas.width = newW;
      canvas.height = newH;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, newW, newH);

      // ✅ 결과를 base64로 변환
      const base64 = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
      const blob = await (await fetch(`data:image/png;base64,${base64}`)).blob();
      const file = new File([blob], "resized.png", { type: "image/png" });

      // ✅ 결과 전파 (ProcessResult 섹션으로 전달)
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: base64 },
        })
      );

      alert("리사이즈 완료!");
    } catch (err) {
      console.error("리사이즈 오류:", err);
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
        disabled={loading || !hasActiveImage}
      >
        {loading ? "리사이즈 중..." : "리사이즈 실행"}
      </button>
    </div>
  );
}
