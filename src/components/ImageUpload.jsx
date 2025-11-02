import React, { useEffect, useRef, useState } from "react";
import "./ImageUpload.css";

const MAX_FILES_PER_UPLOAD = 50;
const UPLOAD_EVENT_NAME = "ellies-upload-update";

const readFileAsBase64 = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        const base64 = result.includes(",") ? result.split(",")[1] : result;
        resolve(base64);
      } else {
        resolve("");
      }
    };
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });

const generateId = (file) => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${file.name}-${Date.now()}-${Math.random()}`;
};

export default function ImageUpload() {
  const [images, setImages] = useState([]);
  const [selected, setSelected] = useState([]);
  const isReadingRef = useRef(false);
  const latestImagesRef = useRef(images);

  useEffect(() => {
    latestImagesRef.current = images;
  }, [images]);

  useEffect(() => {
    return () => {
      latestImagesRef.current.forEach((img) => {
        URL.revokeObjectURL(img.thumbnail);
      });
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (images.length === 0) {
      window.__ellies_uploadedImages = [];
      window.dispatchEvent(new CustomEvent(UPLOAD_EVENT_NAME, { detail: [] }));
      return;
    }

    const allReady = images.every((img) => typeof img.base64 === "string");

    if (!allReady || isReadingRef.current) return;

    const payload = images.map((img) => img.base64);
    window.__ellies_uploadedImages = payload;
    window.dispatchEvent(new CustomEvent(UPLOAD_EVENT_NAME, { detail: payload }));
  }, [images]);

  const handleUpload = async (e) => {
    const { files } = e.target;
    if (!files) return;

    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (fileArray.length > MAX_FILES_PER_UPLOAD) {
      alert("한 번에 50장까지만 업로드할 수 있습니다.");
      e.target.value = "";
      return;
    }

    const newEntries = fileArray.map((file) => ({
      id: generateId(file),
      thumbnail: URL.createObjectURL(file),
      base64: null,
    }));

    setImages((prev) => [...prev, ...newEntries]);
    isReadingRef.current = true;

    try {
      const base64Images = await Promise.all(
        fileArray.map((file) => readFileAsBase64(file))
      );

      setImages((prev) =>
        prev.map((img) => {
          const index = newEntries.findIndex((entry) => entry.id === img.id);
          if (index !== -1) {
            return { ...img, base64: base64Images[index] };
          }
          return img;
        })
      );
    } finally {
      isReadingRef.current = false;
      e.target.value = "";
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((sid) => sid !== id) : [...prev, id]
    );
  };

  const handleRemove = (id) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) {
        URL.revokeObjectURL(target.thumbnail);
      }
      return prev.filter((img) => img.id !== id);
    });
    setSelected((prev) => prev.filter((sid) => sid !== id));
  };

  const handleClearAll = () => {
    isReadingRef.current = false;
    setImages((prev) => {
      prev.forEach((img) => URL.revokeObjectURL(img.thumbnail));
      return [];
    });
    setSelected([]);
  };

  const handleSelectAll = () => {
    setSelected(images.map((img) => img.id));
  };

  const handleUnselectAll = () => {
    setSelected([]);
  };

  return (
    <div className="upload-container">
      <div className="upload-actions">
        <button className="btn" onClick={handleSelectAll}>
          전체선택
        </button>
        <button className="btn" onClick={handleUnselectAll}>
          전체해제
        </button>
        <button className="btn" onClick={handleClearAll}>
          전체삭제
        </button>
      </div>

      <div className="upload-box">
        <label className="upload-label">
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleUpload}
            style={{ display: "none" }}
          />
          <p>📁 클릭 또는 드래그하여 이미지 업로드 (최대 50장)</p>
        </label>
      </div>

      <div className="thumbnail-grid">
        {images.map((img) => (
          <div
            key={img.id}
            className={`thumbnail ${selected.includes(img.id) ? "selected" : ""}`}
            onClick={() => handleSelect(img.id)}
          >
            <img src={img.thumbnail} alt="thumbnail" className="thumb" />
            <button
              className="delete-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove(img.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
