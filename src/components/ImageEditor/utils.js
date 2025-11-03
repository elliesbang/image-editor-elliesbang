export const getImageURL = (selectedImage) => {
  if (!selectedImage) return null;

  if (selectedImage instanceof File) {
    return URL.createObjectURL(selectedImage);
  }

  if (typeof selectedImage === "object") {
    if (selectedImage.file instanceof File) {
      return URL.createObjectURL(selectedImage.file);
    }
    if (selectedImage.thumbnail) {
      return `data:image/png;base64,${selectedImage.thumbnail}`;
    }
  }

  if (typeof selectedImage === "string") {
    if (selectedImage.startsWith("data:image")) return selectedImage;
    return `data:image/png;base64,${selectedImage}`;
  }

  return null;
};
