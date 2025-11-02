import React from "react";

export default function ImageEditor({ selectedImage }) {
  // ✅ blob → base64 변환 유틸
  const blobToBase64 = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result.split(",")[1]);
      reader.readAsDataURL(blob);
    });

  const getImageURL = () => {
    if (!selectedImage) return null;
    if (selectedImage.file) return URL.createObjectURL(selectedImage.file);
    if (selectedImage.thumbnail) return selectedImage.thumbnail;
    if (typeof selectedImage === "string")
      return `data:image/png;base64,${selectedImage}`;
    return null;
  };

  const imgSrc = getImageURL();

  // ✅ 서버 호출 (base64 전송)
  const processImage = async (endpoint) => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");

    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const base64 = await blobToBase64(blob);

      const res = await fetch(`/api/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64 }),
      });

      if (!res.ok) throw new Error(`${endpoint} 요청 실패`);
      const data = await res.json();

      // ✅ 결과 이벤트 전달
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file: blob, thumbnail: data.result },
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

      {!imgSrc && (
        <p
          style={{
            color: "#999",
            fontSize: "0.9rem",
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          이미지를 선택한 후 기능을 사용할 수 있습니다.
        </p>
      )}
    </div>
  );
}
