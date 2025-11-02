import React from "react";

export default function ImageEditor({ selectedImage }) {
  // ✅ 이미지 URL 처리 (File or base64 모두 지원)
  const getImageURL = () => {
    if (!selectedImage) return null;
    if (selectedImage.file) return URL.createObjectURL(selectedImage.file);
    if (selectedImage.thumbnail) return selectedImage.thumbnail;
    if (typeof selectedImage === "string")
      return `data:image/png;base64,${selectedImage}`;
    return null;
  };

  const imgSrc = getImageURL();

  // ✅ 서버 호출 함수
  const processImage = async (endpoint) => {
    if (!imgSrc) {
      alert("이미지를 먼저 선택해주세요!");
      return;
    }

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

      // ✅ 처리 완료 후 이벤트 전달
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
      {/* ✅ 버튼은 항상 활성화 */}
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

      {/* ✅ 이미지 없을 때 안내문 */}
      {!imgSrc && (
        <p
          style={{
            color: "#999",
            fontSize: "0.9rem",
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          이미지를 선택한 후 기능을 사용하세요.
        </p>
      )}
    </div>
  );
}
