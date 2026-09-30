import React, { useState } from "react";

/**
 * Event hero photo gallery: cover image plus extra photos.
 * Clicking a thumbnail makes it the main photo.
 */
export default function EventPhotoGallery({ cover, images = [], title }) {
  const photos = [cover, ...images].filter(Boolean);
  const [active, setActive] = useState(0);
  const src = photos[active] || "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2000";

  return (
    <div>
      {/* Main photo — full flyer at natural aspect, no overlay */}
      <div className="w-full bg-linen dark:bg-[#221B15] flex justify-center">
        <img
          src={src}
          alt={title}
          className="w-auto max-w-full max-h-[75vh] object-contain"
        />
      </div>
      {photos.length > 1 && (
        <div className="w-full bg-linen dark:bg-[#221B15] border-t border-ink/10 dark:border-[#F1E8E0]/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex gap-3 overflow-x-auto">
            {photos.map((url, index) => (
              <button
                key={url + index}
                type="button"
                onClick={() => setActive(index)}
                aria-label={`View photo ${index + 1}`}
                className={`shrink-0 h-16 w-16 rounded-full overflow-hidden transition-opacity ${
                  index === active ? "ring-2 ring-gold-text dark:ring-gold-dark" : "opacity-70 hover:opacity-100"
                }`}
              >
                <img src={url} alt={`${title} photo ${index + 1}`} className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}