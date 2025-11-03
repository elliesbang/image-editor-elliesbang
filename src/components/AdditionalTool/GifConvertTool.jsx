import React, { useState } from "react";
import { getCurrentImage } from "./utils";

export default function GifConvertTool({
  selectedImage,
  selectedImages,
  selectedUploadImage,
  selectedResultImage,
}) {
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  const activeImage = selectedResultImage || selectedUploadImage || selectedImage || (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  const processImage = async () => {
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("caption", caption);

      if (currentImage instanceof File) formData.append("image", currentImage);
      else {
        const clean = currentImage.replace(/^data:image\/(png|jpeg);base64,/, "");
        const blob = await fetch(`data:image/png;base64,${clean}`).then((r) => r.blob());
        formData.append("image", blob, "image.png");
      }

      const res = await fetch("/api/convert-gif", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.result) throw new Error("GIF 변환 실패");

      alert("GIF 변환 완료!");
    } catch (err) {
      console.error("GIF 오류:", err);
      alert("GIF 변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-block">
      <label>GIF 변환</label>
      <input
        type="text"
        className="input"
        placeholder="GIF에 표시할 설명 텍스트 입력"
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        style={{ marginBottom: "8px" }}
      />
      <button className="btn" onClick={processImage} disabled={loading || !hasActiveImage}>
        {loading ? "변환 중..." : "GIF 변환"}
      </button>
    </div>
  );
}
