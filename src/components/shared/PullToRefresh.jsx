import React, { useState, useRef } from "react";
import { Loader2 } from "lucide-react";

export default function PullToRefresh({ onRefresh, children }) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef(null);

  const threshold = 80;

  const handleTouchStart = (e) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e) => {
    if (startY.current === 0 || containerRef.current?.scrollTop > 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0 && distance < 150) {
      setPullDistance(distance);
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      
      try {
        await onRefresh();
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          startY.current = 0;
        }, 500);
      }
    } else {
      setPullDistance(0);
      startY.current = 0;
    }
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="h-full overflow-auto"
    >
      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {/* Pull indicator */}
        <div
          className="flex items-center justify-center transition-all duration-200"
          style={{
            height: `${Math.min(pullDistance, threshold)}px`,
            opacity: Math.min(pullDistance / threshold, 1),
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <Loader2
              className={`h-6 w-6 text-indigo-600 ${
                isRefreshing || pullDistance >= threshold ? "animate-spin" : ""
              }`}
            />
            <span className="text-xs font-medium text-slate-600">
              {isRefreshing
                ? "Refreshing..."
                : pullDistance >= threshold
                ? "Release to refresh"
                : "Pull to refresh"}
            </span>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}