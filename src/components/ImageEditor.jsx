import React, { useMemo } from "react";

export default function ImageEditor({ selectedImage, onProcessComplete }) {
  // ✅ getImageURL()을 useMemo로 감싸서 매 렌더링마다 안정적으로 평가
  const imgSrc = useMemo(() => {
    if (!selectedImage) return null;

    if (selectedImage instanceof File) {
      return URL.createObjectURL(selectedImage);
    }
    if (typeof selectedImage === "object") {
      if (selectedImage.file instanceof File) {
        return URL.createObjectURL(selectedImage.file);
      }
      if (selectedImage.thumbnail) {
        return `data:image/png;base64,${selectedImage.thumbnail}`;
      }
    }
    if (typeof selectedImage === "string") {
      if (selectedImage.startsWith("data:image")) return selectedImage;
      return `data:image/png;base64,${selectedImage}`;
    }
    return null;
  }, [selectedImage]);

  // ✅ 배경제거 (Hugging Face API)
  const removeBackgroundOnly = async () => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "input.png");

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" }, // ✅ Content-Type 자동 설정됨
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "배경제거 실패");

      const resultUrl = `data:image/png;base64,${data.result}`;
      const fileBlob = await fetch(resultUrl).then((r) => r.blob());
      const file = new File([fileBlob], "bg_removed.png", { type: "image/png" });

      // ✅ 부모(App.jsx)에 결과 전달
      onProcessComplete?.(resultUrl);

      // ✅ 브라우저 이벤트로도 전달 (기존 구조 유지)
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: data.result },
        })
      );

      alert("배경제거 완료!");
    } catch (err) {
      console.error("배경제거 오류:", err);
      alert("배경제거 중 오류가 발생했습니다.");
    }
  };

  // ✅ 배경제거 후 자동 크롭
  const removeBackgroundAndCrop = async () => {
    if (!imgSrc) return alert("이미지를 먼저 선택하세요!");
    try {
      const blob = await fetch(imgSrc).then((r) => r.blob());
      const formData = new FormData();
      formData.append("image", blob, "input.png");

      const res = await fetch("/api/remove-bg", {
        method: "POST",
        body: formData,
        headers: { Accept: "application/json" },
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || "배경제거 실패");

      await cropLocally(data.result);
    } catch (err) {
      console.error("배경제거+크롭 오류:", err);
      alert("배경제거+크롭 중 오류가 발생했습니다.");
    }
  };

  // ✅ 로컬 크롭
  const cropLocally = async (base64 = null) => {
    try {
      const src = base64 ? `data:image/png;base64,${base64}` : imgSrc;
      const image = new Image();
      image.src = src;
      await new Promise((resolve) => (image.onload = resolve));

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      const cropWidth = image.width * 0.8;
      const cropHeight = image.height * 0.8;
      const startX = image.width * 0.1;
      const startY = image.height * 0.1;

      canvas.width = cropWidth;
      canvas.height = cropHeight;
      ctx.drawImage(
        image,
        startX,
        startY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedBase64 = canvas.toDataURL("image/png").split(",")[1];
      const croppedUrl = `data:image/png;base64,${croppedBase64}`;
      const blob = await fetch(croppedUrl).then((r) => r.blob());
      const file = new File([blob], "cropped.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: croppedBase64 },
        })
      );

      onProcessComplete?.(croppedUrl);

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

      ctx.filter = "blur(1px) contrast(110%) brightness(105%)";
      ctx.drawImage(image, 0, 0);

      const denoisedBase64 = canvas.toDataURL("image/png").split(",")[1];
      const denoisedUrl = `data:image/png;base64,${denoisedBase64}`;
      const blob = await fetch(denoisedUrl).then((r) => r.blob());
      const file = new File([blob], "denoised.png", { type: "image/png" });

      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: { file, thumbnail: denoisedBase64 },
        })
      );

      onProcessComplete?.(denoisedUrl);

      alert("노이즈 제거 완료!");
    } catch (err) {
      console.error("노이즈 제거 오류:", err);
      alert("노이즈 제거 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="editor-section">
      <div className="button-grid">
        <button className="btn" disabled={!selectedImage} onClick={removeBackgroundOnly}>
          배경제거
        </button>
        <button className="btn" disabled={!selectedImage} onClick={removeBackgroundAndCrop}>
          배경제거 + 크롭
        </button>
        <button className="btn" disabled={!selectedImage} onClick={() => cropLocally()}>
          크롭만
        </button>
        <button className="btn" disabled={!selectedImage} onClick={denoiseLocally}>
          노이즈 제거
        </button>
      </div>

      {!selectedImage && (
        <p
          style={{
            color: "#999",
            fontSize: "0.9rem",
            textAlign: "center",
            marginTop: "8px",
          }}
        >
          이미지를 선택하면 버튼이 활성화됩니다.
        </p>
      )}
    </div>
  );
}
