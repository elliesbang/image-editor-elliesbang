import React, { useMemo, useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchResult } from "../shared/utils";
import { runKeywordAnalysis } from "./worker";

export default function KeywordAnalyzeButton({
  selectedImage,
  selectedImages = [],
  selectedResultImage,
  selectedResultImages = [],
}) {
  const [loading, setLoading] = useState(false);

  const activeImages = useMemo(() => {
    if (Array.isArray(selectedImages) && selectedImages.length > 0) {
      return selectedImages;
    }
    if (
      Array.isArray(selectedResultImages) &&
      selectedResultImages.length > 0
    ) {
      return selectedResultImages;
    }
    return [selectedResultImage || selectedImage].filter(Boolean);
  }, [selectedImage, selectedImages, selectedResultImage, selectedResultImages]);

  const hasSelection = activeImages.length > 0;

  const handleAnalyze = async () => {
    if (!hasSelection) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    setLoading(true);
    try {
      const { title, keywords } = await runKeywordAnalysis(activeImages);
      alert(
        `${ALERT_MESSAGES.KEYWORD_DONE(activeImages.length)}\n\n` +
          `📌 제목: ${title}\n\n` +
          `🪄 키워드: ${keywords.join(", ")}`
      );

      dispatchResult(null, "키워드 분석", {
        result: keywords.join(", "),
        meta: { title },
      });
    } catch (error) {
      console.error("키워드 분석 오류", error);
      alert("키워드 분석 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn" onClick={handleAnalyze} disabled={loading || !hasSelection}>
      {loading ? "분석 중..." : "키워드 분석"}
    </button>
  );
}
