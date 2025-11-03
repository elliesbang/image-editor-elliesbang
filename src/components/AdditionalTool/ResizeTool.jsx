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
  const [loading, setLoading] = useState(false);

  const activeImage = selectedResultImage || selectedUploadImage || selectedImage || (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  const processImage = async (endpoint, extra = {}) => {
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();
      if (currentImage instanceof File) formData.append("image", currentImage);
      else if (typeof currentImage === "string") {
        const clean = currentImage.replace(/^data:image\/(png|jpeg);base64,/, "");
        const blob = await fetch(`data:image/png;base64,${clean}`).then((r) => r.blob());
        formData.append("image", blob, "image.png");
      }

      Object.entries(extra).forEach(([k, v]) => formData.append(k, v));

      const res = await fetch(`/api/${endpoint}`, { method: "POST", body: formData });
      const data = await res.json();
      if (!data.result) throw new Error("리사이즈 실패");

      const blob = await fetch(`data:image/png;base64,${data.result}`).then((r) => r.blob());
      const file = new File([blob], "resized.png", { type: "image/png" });
      window.dispatchEvent(new CustomEvent("imageProcessed", { detail: { file, thumbnail: data.result } }));

      alert("리사이즈 완료!");
    } catch (err) {
      console.error("리사이즈 오류:", err);
      alert("리사이즈 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleResize = async () => {
    if (!resizeW) return alert("가로(px)를 입력하세요!");
    await processImage("resize", { width: resizeW });
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
      <button className="btn" onClick={handleResize} disabled={loading || !hasActiveImage}>
        리사이즈 실행
      </button>
    </div>
  );
}
