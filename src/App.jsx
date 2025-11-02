import React, { useState } from "react";
import ImageUpload from "./components/ImageUpload";
import ImageEditor from "./components/ImageEditor";
import Analyzer from "./components/Analyzer";
import AdditionalEditor from "./components/AdditionalEditor";
import Footer from "./components/Footer";
import "./App.css";

function App() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const handleImagesUploaded = (newImages) => {
    setImages((prev) => [...prev, ...newImages]);
  };

  return (
    <div className="app">
      <ImageUpload
        onImagesUploaded={handleImagesUploaded}
        selectedImage={selectedImage}
        setSelectedImage={setSelectedImage}
      />

      <ImageEditor selectedImage={selectedImage} />
      <Analyzer selectedImage={selectedImage} />
      <AdditionalEditor selectedImage={selectedImage} />
      <Footer />
    </div>
  );
}

export default App;
