// ✅ 이미지 입력(JSON or FormData) 자동 파싱 공용 함수
export async function parseImageInput(request) {
  const contentType = request.headers.get("content-type") || "";
  let imageBase64 = null;

  try {
    // ✅ JSON 요청 (application/json)
    if (contentType.includes("application/json")) {
      const body = await request.json();
      imageBase64 = body?.imageBase64 || null;
    }

    // ✅ 파일 업로드 요청 (multipart/form-data)
    else if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("image");
      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        // ✅ btoa(String.fromCharCode(...))은 대용량에서 크래시 가능 → 루프 방식으로 안정 변환
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        imageBase64 = btoa(binary);
      }
    }

    // ✅ 그 외 Content-Type 예외 처리
    else {
      throw new Error(`지원하지 않는 Content-Type: ${contentType}`);
    }

    if (!imageBase64) throw new Error("이미지 데이터가 없습니다.");
    return imageBase64;
  } catch (err) {
    console.error("parseImageInput 오류:", err);
    throw new Error("이미지 입력 처리 중 오류 발생");
  }
}
