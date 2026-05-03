"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, Expand } from "lucide-react";

interface ImageGalleryProps {
  images: { url: string; order?: number }[];
  title: string;
}

export function ImageGallery({ images, title }: ImageGalleryProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const displayImages = images.length > 0 ? images : [
    { url: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1200", order: 0 },
  ];
  const hasMultipleImages = displayImages.length > 1;

  const nextImage = () => setCurrentIndex((prev) => (prev + 1) % displayImages.length);
  const prevImage = () => setCurrentIndex((prev) => (prev === 0 ? displayImages.length - 1 : prev - 1));

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative h-[400px] md:h-[600px] w-full rounded-3xl overflow-hidden group">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={displayImages[currentIndex].url}
                alt={`${title} - Image ${currentIndex + 1}`}
                fill
                className="object-cover cursor-pointer hover:scale-105 transition-transform duration-700"
                onClick={() => setIsFullscreen(true)}
              />
            </motion.div>
          </AnimatePresence>

          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors duration-500 pointer-events-none" />

          {/* Controls */}
          {hasMultipleImages && (
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button onClick={prevImage} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white text-slate-800 transition-colors shadow-lg">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button onClick={nextImage} className="w-12 h-12 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center hover:bg-white text-slate-800 transition-colors shadow-lg">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>
          )}

          <button 
            onClick={() => setIsFullscreen(true)}
            className="absolute top-4 right-4 w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors opacity-0 group-hover:opacity-100"
          >
            <Expand className="w-5 h-5" />
          </button>
        </div>

        {/* Thumbnails */}
        {hasMultipleImages && <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {displayImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-24 w-32 shrink-0 rounded-xl overflow-hidden transition-all duration-300 ${
                currentIndex === idx ? "ring-2 ring-primary ring-offset-2 scale-95 opacity-100" : "opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>}
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-sm flex flex-col"
          >
            <div className="p-6 flex justify-end">
              <button onClick={() => setIsFullscreen(false)} className="text-white/70 hover:text-white transition-colors p-2 bg-white/10 rounded-full hover:bg-white/20">
                <X className="w-8 h-8" />
              </button>
            </div>
            
            <div className="flex-1 relative flex items-center justify-center px-4 md:px-20 overflow-hidden pb-10">
              <motion.div
                key={currentIndex + "fullscreen"}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full max-w-6xl max-h-[80vh]"
              >
                <Image
                  src={displayImages[currentIndex].url}
                  alt={`${title} - Fullscreen`}
                  fill
                  className="object-contain"
                />
              </motion.div>

              {hasMultipleImages && (
                <>
                  <button onClick={prevImage} className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors">
                    <ChevronLeft className="w-8 h-8" />
                  </button>
                  <button onClick={nextImage} className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 text-white transition-colors">
                    <ChevronRight className="w-8 h-8" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
