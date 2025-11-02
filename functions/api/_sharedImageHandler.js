// ✅ 이미지 입력(JSON or FormData) 자동 파싱 공용 함수
export async function parseImageInput(request) {
  const contentType = request.headers.get("content-type") || "";
  let imageBase64 = null;

  if (contentType.includes("application/json")) {
    const body = await request.json();
    imageBase64 = body.imageBase64;
  } else if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const file = formData.get("image");
    if (file) {
      const arrayBuffer = await file.arrayBuffer();
      imageBase64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
    }
  }

  if (!imageBase64) throw new Error("이미지 데이터가 없습니다.");
  return imageBase64;
}
