import React, { useState } from "react";
import { ALERT_MESSAGES } from "../shared/config";
import { dispatchDenoiseResult, runDenoise } from "./worker";

export default function DenoiseButton({ selectedImages = [], disabled }) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (!selectedImages.length) {
      alert(ALERT_MESSAGES.NO_SELECTION);
      return;
    }

    setLoading(true);
    try {
      const results = await Promise.all(selectedImages.map(runDenoise));
      results.forEach((url) => dispatchDenoiseResult(url));
      alert(ALERT_MESSAGES.DENOISE_DONE(results.length));
    } catch (error) {
      console.error("노이즈 제거 오류", error);
      alert("노이즈 제거 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button className="btn" onClick={handleClick} disabled={disabled || loading}>
      {loading ? "처리 중..." : "노이즈 제거"}
    </button>
  );
}
