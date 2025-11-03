import React, { useState } from "react";
import { getCurrentImage } from "./utils";

export default function SvgConvertTool({
  selectedImage,
  selectedImages,
  selectedUploadImage,
  selectedResultImage,
}) {
  const [loading, setLoading] = useState(false);

  const activeImage = selectedResultImage || selectedUploadImage || selectedImage || (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  const processImage = async (colors) => {
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("colors", colors);

      if (currentImage instanceof File) formData.append("image", currentImage);
      else {
        const clean = currentImage.replace(/^data:image\/(png|jpeg);base64,/, "");
        const blob = await fetch(`data:image/png;base64,${clean}`).then((r) => r.blob());
        formData.append("image", blob, "image.png");
      }

      const res = await fetch("/api/convert-svg", { method: "POST", body: formData });
      const data = await res.json();
      if (!data.result) throw new Error("SVG 변환 실패");

      alert("SVG 변환 완료!");
    } catch (err) {
      console.error("SVG 오류:", err);
      alert("SVG 변환 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tool-block">
      <label>SVG 변환</label>
      <select id="svgColorSelect" className="input" defaultValue="1" style={{ marginBottom: "8px" }}>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <option key={n} value={n}>{`${n}색`}</option>
        ))}
      </select>
      <button
        className="btn"
        onClick={() => processImage(document.getElementById("svgColorSelect").value)}
        disabled={loading || !hasActiveImage}
      >
        {loading ? "변환 중..." : "SVG 변환"}
      </button>
    </div>
  );
}
