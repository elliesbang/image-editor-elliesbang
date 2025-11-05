import React, { useState } from "react";

export default function KeywordAnalyzeTool({
  selectedImage,
  selectedImages = [],
  selectedResultImage,
  selectedResultImages = [],
}) {
  const [loading, setLoading] = useState(false);

  // ✅ 우선순위: 여러 장 > 단일 결과 > 단일 업로드
  const activeImages =
    (selectedImages.length && selectedImages) ||
    (selectedResultImages.length && selectedResultImages) ||
    [selectedResultImage || selectedImage].filter(Boolean);

  const hasActive = activeImages.length > 0;

  const handleClick = async () => {
    if (!hasActive) {
      alert("분석할 이미지를 하나 이상 선택하세요!");
      return;
    }

    setLoading(true);
    try {
      // ✅ Base64 변환 후 API 요청 (워커 AI는 백엔드에서 처리)
      const base64List = await Promise.all(
        activeImages.map(async (img) => {
          let imgSrc =
            typeof img === "string"
              ? img
              : img.thumbnail || img.src || URL.createObjectURL(img.file);

          // blob: URL → base64 변환
          if (!imgSrc.startsWith("data:image")) {
            const blob = await fetch(imgSrc).then((r) => r.blob());
            const reader = new FileReader();
            imgSrc = await new Promise((resolve) => {
              reader.onloadend = () => resolve(reader.result);
              reader.readAsDataURL(blob);
            });
          }
          return imgSrc;
        })
      );

      // ✅ Cloudflare Pages Functions 호출
      const res = await fetch("/api/keyword-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: base64List }),
      });

      const data = await res.json();

      if (!data.success) {
        console.error("🚨 키워드 분석 오류:", data.error);
        alert("키워드 분석 중 오류가 발생했습니다.");
        return;
      }

      console.log("🧠 키워드 분석 결과:", data);

      alert(
        `✅ ${activeImages.length}개의 이미지 키워드 분석 완료!\n\n` +
          `📌 제목: ${data.title}\n\n` +
          `🪄 키워드: ${data.keywords.join(", ")}`
      );

      // ✅ 결과 이벤트 전송 (ProcessResult에 반영 가능)
      window.dispatchEvent(
        new CustomEvent("imageProcessed", {
          detail: {
            result: data.keywords.join(", "),
            meta: { label: "키워드 분석" },
          },
        })
      );
    } catch (err) {
      console.error("🚨 키워드 분석 오류:", err);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={loading || !hasActive}>
      {loading ? "분석 중..." : "키워드 분석"}
    </button>
  );
}
