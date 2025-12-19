import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Download, ZoomIn, ZoomOut, AlertCircle } from 'lucide-react';

interface ImageViewerModalProps {
  images: string[];
  initialIndex?: number;
  onClose: () => void;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  images,
  initialIndex = 0,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(100);
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const currentImage = images[currentIndex];
  const hasMultiple = images.length > 1;

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setImageError(false);
    setImageLoading(true);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setImageError(false);
    setImageLoading(true);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 20, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 20, 50));
  };

  const handleDownload = () => {
    const filename = currentImage.split('/').pop() || 'image.jpg';
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    console.error('Failed to load image:', currentImage);
    console.error('Image URL:', currentImage);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="relative bg-black rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col animate-slide-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <h3 className="text-white font-semibold">
              Image {currentIndex + 1} of {images.length}
            </h3>
            <span className="text-slate-400 text-sm truncate">
              {currentImage.split('/').pop()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-5 h-5 text-white" />
            </button>
            <span className="text-white text-sm font-medium px-2">{zoom}%</span>
            <button
              onClick={handleZoomIn}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-5 h-5 text-white" />
            </button>
            <div className="w-px h-6 bg-slate-700 mx-2" />
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Image Container */}
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto bg-black/50">
          {imageError ? (
            <div className="flex flex-col items-center justify-center gap-4">
              <AlertCircle className="w-16 h-16 text-red-500" />
              <div className="text-center">
                <p className="text-white font-semibold mb-2">Failed to load image</p>
                <p className="text-slate-400 text-sm">{currentImage}</p>
                <button
                  onClick={handleDownload}
                  className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  Download Instead
                </button>
              </div>
            </div>
          ) : (
            <>
              {imageLoading && (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
                </div>
              )}
              <img
                src={currentImage}
                alt={`Image ${currentIndex + 1}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                style={{
                  transform: `scale(${zoom / 100})`,
                  display: imageLoading ? 'none' : 'block',
                }}
                className="max-w-full max-h-full object-contain transition-transform duration-200 rounded-lg"
              />
            </>
          )}
        </div>

        {/* Navigation */}
        {hasMultiple && (
          <>
            <button
              onClick={goToPrev}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-6 h-6 text-white" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 p-3 bg-black/50 hover:bg-black/70 rounded-lg transition-colors"
              title="Next"
            >
              <ChevronRight className="w-6 h-6 text-white" />
            </button>

            {/* Thumbnails */}
            <div className="bg-slate-900 border-t border-slate-700 p-4 overflow-x-auto">
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setImageError(false);
                      setImageLoading(true);
                    }}
                    className={`flex-shrink-0 rounded-lg overflow-hidden transition-all ${
                      idx === currentIndex
                        ? 'ring-2 ring-blue-500 scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`Thumbnail ${idx + 1}`}
                      className="w-16 h-16 object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23444%22 width=%2264%22 height=%2264%22/%3E%3Ctext x=%2232%22 y=%2232%22 fill=%22%23999%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22 font-family=%22Arial%22 font-size=%2212%22%3EError%3C/text%3E%3C/svg%3E';
                      }}
                      crossOrigin="anonymous"
                    />
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ImageViewerModal;
