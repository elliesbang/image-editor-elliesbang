import React, { useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchBackgroundResult, runRemoveBg } from "./worker";

export default function BackgroundRemoveButton({
  selectedImages = [],
  disabled,
}) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!selectedImages.length) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(selectedImages.map(runRemoveBg));
      results.forEach((url) => dispatchBackgroundResult(url));
      alert(ALERT_MESSAGES.BACKGROUND_DONE(results.length));
    } catch (error) {
      console.error("배경제거 오류", error);
      alert("배경제거 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled || loading}>
      {loading ? "처리 중..." : "배경제거"}
    </button>
  );
}
