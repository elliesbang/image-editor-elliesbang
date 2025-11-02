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
    <div className="app-layout">
      <main className="app-main">
        <section className="app-section">
          <ImageUpload
            onImagesUploaded={handleImagesUploaded}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </section>

        <section className="app-section">
          <ImageEditor selectedImage={selectedImage} />
        </section>

        <section className="app-section">
          <Analyzer selectedImage={selectedImage} />
        </section>

        <section className="app-section">
          <AdditionalEditor selectedImage={selectedImage} />
        </section>

        <Footer />
      </main>
    </div>
  );
}

export default App;
