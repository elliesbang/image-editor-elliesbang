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
  const [keepAspect, setKeepAspect] = useState(true); // ✅ 비율 유지 옵션 추가
  const [loading, setLoading] = useState(false);

  const activeImage =
    selectedResultImage ||
    selectedUploadImage ||
    selectedImage ||
    (Array.isArray(selectedImages) && selectedImages[0]);
  const hasActiveImage = Boolean(activeImage);

  // ✅ 공통 이미지 처리 함수
  const processImage = async (endpoint, extra = {}) => {
    const currentImage = getCurrentImage(activeImage);
    if (!currentImage) return alert("이미지를 먼저 선택하세요!");
    setLoading(true);

    try {
      const formData = new FormData();
      if (currentImage instanceof File) {
        formData.append("image", currentImage);
      } else if (typeof currentImage === "string") {
        const clean = currentImage.replace(/^data:image\/(png|jpeg);base64,/, "");
        const blob = await fetch(`data:image/png;base64,${clean}`).then((r) => r.blob());
        formData.append("image", blob, "image.png");
      }

      // ✅ 옵션 추가
      Object.entries(extra).forEach(([k, v]) => formData.append(k, v));

      const res = await fetch(`/api/${endpoint}`, { method: "POST", body: formData });
      const data = await res.json();
      if (!data.result) throw new Error("리사이즈 실패");

      // ✅ 리사이즈 결과 이미지 표시
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

  // ✅ 리사이즈 실행
  const handleResize = async () => {
    if (!resizeW) return alert("가로(px)를 입력하세요!");
    await processImage("resize", {
      width: resizeW,
      keepAspect: keepAspect ? "true" : "false", // ✅ 비율 유지 여부 전달
    });
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

      {/* ✅ 비율 유지 옵션 */}
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
