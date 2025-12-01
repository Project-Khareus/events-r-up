import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Image as ImageIcon } from "lucide-react";

const SafeImage = ({ src, alt, className }) => {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className={`bg-slate-100 flex items-center justify-center ${className}`}>
        <ImageIcon className="w-6 h-6 text-slate-300" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  );
};

export default function ImageGallery({ images, businessName }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-auto lg:h-[500px]">
      {/* Thumbnails - Vertical on Desktop, Horizontal on Mobile */}
      {images.length > 1 && (
        <div className="order-2 lg:order-1 flex lg:flex-col gap-3 overflow-auto lg:overflow-y-auto lg:w-[88px] scrollbar-hide shrink-0 pb-2">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`shrink-0 w-[72px] h-[72px] lg:w-[88px] lg:h-[88px] rounded-xl overflow-hidden border-2 transition-all bg-slate-100 ${
                selectedIndex === index 
                  ? "border-slate-900 opacity-100" 
                  : "border-transparent opacity-60 hover:opacity-100 hover:border-slate-300"
              }`}
            >
              <SafeImage
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Main Image */}
      <div 
        className="order-1 lg:order-2 relative flex-1 h-96 lg:h-full bg-slate-100 rounded-2xl overflow-hidden group cursor-pointer"
        onClick={() => setIsLightboxOpen(true)}
      >
        <SafeImage
          src={images[selectedIndex]}
          alt={`${businessName} - Image ${selectedIndex + 1}`}
          className="w-full h-full object-cover"
        />
        
        <div className="absolute top-4 right-4 bg-white/90 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
          <Maximize2 className="h-5 w-5 text-slate-700" />
        </div>
        
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronLeft className="h-6 w-6 text-slate-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
            >
              <ChevronRight className="h-6 w-6 text-slate-700" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox */}
      {isLightboxOpen && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
          onClick={() => setIsLightboxOpen(false)}
        >
          <button
            onClick={() => setIsLightboxOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X className="h-6 w-6 text-white" />
          </button>
          
          <button
            onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
            className="absolute left-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
          
          <img
            src={images[selectedIndex]}
            alt={`${businessName} - Image ${selectedIndex + 1}`}
            className="max-h-[85vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          <button
            onClick={(e) => { e.stopPropagation(); goToNext(); }}
            className="absolute right-4 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
          
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full">
            {selectedIndex + 1} / {images.length}
          </div>
        </div>
      )}
    </div>
  );
}