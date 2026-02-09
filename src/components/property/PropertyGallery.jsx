"use client";

import { useState } from "react";

export default function PropertyGallery({ images = [] }) {
  const gallery =
    images.length > 0
      ? images
      : [
          "/demo/property1.jpg",
          "/demo/property2.jpg",
          "/demo/property3.jpg",
          "/demo/property4.jpg",
          "/demo/property5.jpg",
        ];

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const next = () =>
    setActiveIndex((prev) => (prev === gallery.length - 1 ? 0 : prev + 1));

  const prev = () =>
    setActiveIndex((prev) => (prev === 0 ? gallery.length - 1 : prev - 1));

  return (
    <>
      {/* TOP STRIP FOR TRANSPARENT HEADER */}
      <div className="absolute top-0 left-0 w-full h-20 bg-[#0A1F44]" />

      {/* DESKTOP */}
      <section className="hidden md:block relative mt-[96px]">
        <div className="max-w-[1800px] mx-auto px-2">
          <div className="grid grid-cols-4 gap-2 h-[520px]">
            
            {/* MAIN IMAGE */}
            <div className="col-span-2 h-full rounded-lg overflow-hidden">
              <img
                src={gallery[0]}
                alt="Property"
                onClick={() => {
                  setActiveIndex(0);
                  setOpen(true);
                }}
                className="w-full h-full object-cover cursor-pointer"
              />
            </div>

            {/* SIDE IMAGES */}
            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {gallery.slice(1, 5).map((img, i) => {
                const realIndex = i + 1;
                return (
                  <div
                    key={i}
                    className="h-full w-full rounded-lg overflow-hidden relative"
                  >
                    <img
                      src={img}
                      alt="Property"
                      onClick={() => {
                        setActiveIndex(realIndex);
                        setOpen(true);
                      }}
                      className="w-full h-full object-cover cursor-pointer"
                    />

                    {i === 3 && (
                      <button
                        onClick={() => {
                          setActiveIndex(realIndex);
                          setOpen(true);
                        }}
                        className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold hover:bg-black/60 transition"
                      >
                        View All Photos
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* MOBILE SLIDER */}
      <section className="md:hidden mt-22">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-2">
          {gallery.map((img, i) => (
            <div
              key={i}
              className="min-w-[85%] h-[260px] snap-center rounded-xl overflow-hidden"
            >
              <img
                src={img}
                alt="Property"
                onClick={() => {
                  setActiveIndex(i);
                  setOpen(true);
                }}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* FULLSCREEN VIEWER */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center">
          
          {/* Close */}
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-white text-xl"
          >
            ✕
          </button>

          {/* Prev */}
          <button
            onClick={prev}
            className="absolute left-6 text-white text-4xl"
          >
            ‹
          </button>

          {/* Image */}
          <img
            src={gallery[activeIndex]}
            className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg"
          />

          {/* Next */}
          <button
            onClick={next}
            className="absolute right-6 text-white text-4xl"
          >
            ›
          </button>

          {/* Counter */}
          <div className="absolute bottom-6 text-white text-sm">
            {activeIndex + 1} / {gallery.length}
          </div>
        </div>
      )}
    </>
  );
}
