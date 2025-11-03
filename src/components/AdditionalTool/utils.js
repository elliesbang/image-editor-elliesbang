export const getCurrentImage = (img) => {
  if (!img) return null;

  if (img instanceof File) return img;

  if (typeof img === "object") {
    if (img.file instanceof File) return img.file;
    if (img.thumbnail) return `data:image/png;base64,${img.thumbnail}`;
  }

  if (typeof img === "string") {
    if (img.startsWith("data:image")) return img;
    return `data:image/png;base64,${img}`;
  }

  return null;
};

export const blobToBase64 = (blob) =>
  new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onerror = (err) => reject(err);
      reader.onloadend = () => {
        const result = reader.result || "";
        const base64 = result.split(",")[1] || "";
        resolve(base64);
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      reject(err);
    }
  });
