import React, { useState } from "react";
import { ChevronLeft, ChevronRight, X, Maximize2, Play } from "lucide-react";

export default function MediaGallery({ images = [], videos = [], businessName }) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Combine images and videos into a single media array
  const allMedia = [
    ...images.map(url => ({ type: 'image', url })),
    ...videos.map(url => ({ type: 'video', url }))
  ];

  if (allMedia.length === 0) return null;

  const goToPrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setSelectedIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = allMedia[selectedIndex];

  return (
    <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 h-auto lg:h-[500px]">
      {/* Thumbnails - Vertical on Desktop, Horizontal on Mobile */}
      {allMedia.length > 1 && (
        <div className="order-2 lg:order-1 flex lg:flex-col gap-2 sm:gap-3 lg:w-[88px] shrink-0 py-1">
          {allMedia.slice(0, 4).map((media, index) => (
            <button
              key={index}
              onClick={() => setSelectedIndex(index)}
              className={`relative shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] lg:w-[88px] lg:h-[88px] rounded-lg sm:rounded-xl overflow-hidden border-2 transition-all bg-slate-100 ${
                selectedIndex === index 
                  ? "border-slate-900 opacity-100 shadow-sm" 
                  : "border-transparent opacity-70 hover:opacity-100 hover:border-slate-300"
              }`}
            >
              {media.type === 'video' ? (
                <>
                  <video
                    src={media.url}
                    className="w-full h-full object-cover block"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                    <Play className="h-4 w-4 text-white fill-white" />
                  </div>
                </>
              ) : (
                <img
                  src={media.url}
                  alt=""
                  className="w-full h-full object-cover block"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              )}
              {index === 3 && allMedia.length > 4 && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{allMedia.length - 4}</span>
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Main Media */}
      <div 
        className="order-1 lg:order-2 relative flex-1 h-64 sm:h-80 md:h-96 lg:h-full bg-slate-100 rounded-xl sm:rounded-2xl overflow-hidden group cursor-pointer"
        onClick={() => currentMedia.type === 'image' && setIsLightboxOpen(true)}
      >
        {currentMedia.type === 'video' ? (
          <video
            src={currentMedia.url}
            className="w-full h-full object-cover"
            controls
            controlsList="nodownload"
          />
        ) : (
          <img
            src={currentMedia.url}
            alt={`${businessName} - Media ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
          />
        )}
        
        {currentMedia.type === 'image' && (
          <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-white/90 p-1.5 sm:p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
            <Maximize2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-700" />
          </div>
        )}
        
        {allMedia.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goToPrevious(); }}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goToNext(); }}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg hover:bg-white transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
            >
              <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 text-slate-700" />
            </button>
          </>
        )}
      </div>

      {/* Lightbox (for images only) */}
      {isLightboxOpen && currentMedia.type === 'image' && (
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
            src={currentMedia.url}
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
            {selectedIndex + 1} / {allMedia.length}
          </div>
        </div>
      )}
    </div>
  );
}