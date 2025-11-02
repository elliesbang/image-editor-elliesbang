import React from "react";

export default function ImageEditor({ selectedImage }) {
  const getImageURL = () => {
    if (!selectedImage) return null;
    if (selectedImage.file) return URL.createObjectURL(selectedImage.file);
    if (selectedImage.thumbnail)
      return `data:image/png;base64,${selectedImage.thumbnail}`;
    if (typeof selectedImage === "string")
      return `data:image/png;base64,${selectedImage}`;
    return null;
  };

  const imgSrc = getImageURL();

  // ✅ 배경제거 (Hugging Face API)
  const removeBackground = async () => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const binary = new Uint8Array(await blob.arrayBuffer());
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: {},
        body: binary,
      });

      const data = await res.json();
      if (!data.result) throw new Error("배경제거 실패");

      // ✅ 결과 바로 크롭으로 전달 가능
      await cropLocally(data.result);
    } catch (err) {
      console.error("배경제거 오류:", err);
      alert("배경제거 중 오류가 발생했습니다.");
    }
  };

  // ✅ 로컬 크롭
  const cropLocally = async (base64 = null) => {
    try {
      const src = base64
        ? `data:image/png;base64,${base64}`
        : imgSrc;
      const image = new Image();
      image.src = src;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      // 중앙 기준 80% 크롭
      const cropWidth = image.width * 0.8;
      const cropHeight = image.height * 0.8;
      const startX = image.width * 0.1;
      const startY = image.height * 0.1;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(image, startX, startY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

      const croppedBase64 = canvas.toDataURL("image/png").split(",")[1];
      const blob = await fetch(canvas.toDataURL("image/png")).then((r) => r.blob());
      const file = new File([blob], "cropped.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: croppedBase64 },
        })
      );

      alert("크롭 완료!");
    } catch (err) {
      console.error("크롭 오류:", err);
      alert("크롭 중 오류가 발생했습니다.");
    }
  };

  // ✅ 로컬 노이즈 제거 (Canvas blur)
  const denoiseLocally = async () => {
    try {
      if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
      const image = new Image();
      image.src = imgSrc;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      canvas.width = image.width;
      canvas.height = image.height;

      // 노이즈 제거 효과 (살짝 블러 + 명암 조정)
      ctx.filter = "blur(1px) contrast(110%) brightness(105%)";
      ctx.drawImage(image, 0, 0);

      const denoisedBase64 = canvas.toDataURL("image/png").split(",")[1];
      const blob = await fetch(canvas.toDataURL("image/png")).then((r) => r.blob());
      const file = new File([blob], "denoised.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: denoisedBase64 },
        })
      );

      alert("노이즈 제거 완료!");
    } catch (err) {
      console.error("노이즈 제거 오류:", err);
      alert("노이즈 제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="editor-section">
      <div className="button-grid">
        <button className="btn" disabled={!imgSrc} onClick={removeBackground}>
          배경제거 + 크롭
        </button>
        <button className="btn" disabled={!imgSrc} onClick={() => cropLocally()}>
          크롭만
        </button>
        <button className="btn" disabled={!imgSrc} onClick={denoiseLocally}>
          노이즈 제거
        </button>
      </div>

      {!imgSrc && (
        <p style={{ color: "#999", fontSize: "0.9rem", textAlign: "center", marginTop: "8px" }}>
          이미지를 선택하면 버튼이 활성화됩니다.
        </p>
      )}
    </div>
  );
}