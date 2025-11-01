const handleRemoveBg = async () => {
  if (!selectedImages.length) {
    alert("이미지를 선택해주세요!");
    return;
  }

  for (const img of selectedImages) {
    try {
      const res = await fetch("/api/remove-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: img }),
      });

      const data = await res.json();

      if (data.image_base64) {
        setResults((prev) => [...prev, data.image_base64]);
      } else if (data.data?.[0]?.b64_json) {
        // OpenAI 형식인 경우
        setResults((prev) => [...prev, data.data[0].b64_json]);
      } else {
        console.error("Unexpected API response", data);
      }
    } catch (err) {
      console.error("배경제거 오류:", err);
    }
  }
};
