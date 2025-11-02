import React from "react";

export default function ImageEditor({ selectedImage }) {
  // ✅ 이미지 URL 통합 처리
  const getImageURL = () => {
    if (!selectedImage) return null;
    if (selectedImage.file) return URL.createObjectURL(selectedImage.file);
    if (typeof selectedImage === "string") return `data:image/png;base64,${selectedImage}`;
    return null;
  };

  const imgSrc = getImageURL();

  // ✅ 서버 호출
  const processImage = async (endpoint) => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const file = new File([blob], "target.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(`${endpoint} 요청 실패`);
      const data = await res.json();

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: data.result },
        })
      );

      alert(`${endpoint} 완료!`);
    } catch (err) {
      console.error(`${endpoint} 오류:`, err);
      alert("이미지 처리 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="editor-section">
      {/* ✅ 이미지가 없을 때 */}
      {!imgSrc ? (
        <p style={{ color: "#999", fontSize: "0.9rem" }}>이미지를 선택하세요.</p>
      ) : (
        <>
          {/* ✅ 미리보기 */}
          <div className="preview-box">
            <img
              src={imgSrc}
              alt="미리보기"
              style={{
                maxWidth: "100%",
                borderRadius: "8px",
                marginBottom: "16px",
              }}
            />
          </div>

          {/* ✅ 기능 버튼 */}
          <div className="button-grid">
            <button className="btn" onClick={() => processImage("remove-bg")}>
              배경제거
            </button>
            <button className="btn" onClick={() => processImage("crop")}>
              크롭
            </button>
            <button className="btn" onClick={() => processImage("remove-bg-crop")}>
              배경제거 + 크롭
            </button>
            <button className="btn" onClick={() => processImage("denoise")}>
              노이즈 제거
            </button>
          </div>
        </>
      )}
    </div>
  );
}
