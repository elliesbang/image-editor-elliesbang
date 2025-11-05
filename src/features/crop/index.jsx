import React, { useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchResult } from "../shared/utils";
import { runAutoCrop } from "./worker";

export default function CropButton({ selectedImages = [], disabled }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!selectedImages.length) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(selectedImages.map(runAutoCrop));
      results.forEach((url) => dispatchResult(url, "AI 크롭"));
      alert(ALERT_MESSAGES.CROP_DONE(results.length));
    } catch (error) {
      console.error("AI 크롭 오류", error);
      alert("AI 크롭 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled || loading}>
      {loading ? "처리 중..." : "크롭만"}
    </button>
  );
}
