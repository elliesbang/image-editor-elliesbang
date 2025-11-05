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
      // ✅ 여러 장 AI 분석
      const results = await Promise.all(
        activeImages.map(async (img, i) => {
          const imgSrc =
            typeof img === "string"
              ? img
              : img.thumbnail || img.src || URL.createObjectURL(img.file);

          const res = await AI.run("@cf/elliesbang/analyze-keywords", {
            image: imgSrc,
          });

          return {
            index: i + 1,
            keywords: res.keywords,
            title: res.title,
          };
        })
      );

      console.log("🧠 키워드 분석 결과:", results);

      alert(`✅ ${results.length}개의 이미지 키워드 분석 완료!`);
      // 이후 UI 표시 / 복사 버튼은 ProcessResult 확장으로 표시 가능
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
