"use client";

import { useState, memo } from "react";
import Image from "next/image";


const PLACEHOLDER_IMAGE = "/images/placeholder.jpg";

function PropertyGallery({ images = [] }) {
  // Use only real images from API/listing; no demo images
  const gallery = images.length > 0 ? images : [PLACEHOLDER_IMAGE];
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
            <div className="col-span-2 h-full rounded-lg overflow-hidden relative">
              <Image
                src={gallery[0]}
                alt="Property"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover cursor-pointer"
                onClick={() => {
                  setActiveIndex(0);
                  setOpen(true);
                }}
                unoptimized={gallery[0]?.startsWith('http') && !gallery[0]?.includes('images.unsplash.com')}
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
                    <Image
                      src={img}
                      alt="Property"
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover cursor-pointer"
                      onClick={() => {
                        setActiveIndex(realIndex);
                        setOpen(true);
                      }}
                      loading="lazy"
                      unoptimized={img?.startsWith('http') && !img?.includes('images.unsplash.com')}
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
              <Image
                src={img}
                alt="Property"
                fill
                sizes="85vw"
                className="object-cover cursor-pointer"
                onClick={() => {
                  setActiveIndex(i);
                  setOpen(true);
                }}
                loading={i < 2 ? "eager" : "lazy"}
                unoptimized={img?.startsWith('http') && !img?.includes('images.unsplash.com')}
              />
            </div>
          ))}
        </div>
      </section>

     {/* FULLSCREEN VIEWER */}
{open && (
  <div className="fixed inset-0 z-[100] bg-black/95">

    {/* Close */}
    <button
      onClick={() => setOpen(false)}
      className="absolute top-6 right-6 text-white text-xl z-50"
    >
      ✕
    </button>

    {/* ================= DESKTOP SLIDER ================= */}
    <div className="hidden md:flex items-center justify-center h-full">
      
      {/* Prev */}
      <button
        onClick={prev}
        className="absolute left-6 text-white text-4xl"
      >
        ‹
      </button>

      {/* Image */}
      <div className="relative max-h-[85vh] max-w-[90vw] aspect-video">
        <Image
          src={gallery[activeIndex]}
          alt="Property"
          fill
          className="object-contain rounded-lg"
          unoptimized={gallery[activeIndex]?.startsWith('http') && !gallery[activeIndex]?.includes('images.unsplash.com')}
        />
      </div>

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

    {/* ================= MOBILE VERTICAL SCROLL ================= */}
    <div className="md:hidden overflow-y-auto h-full pt-20 px-4 pb-10 space-y-6">
      {gallery.map((img, i) => (
        <div key={i} className="relative w-full aspect-video rounded-xl overflow-hidden">
          <Image
            src={img}
            alt="Property"
            fill
            className="object-cover"
            loading={i < 3 ? "eager" : "lazy"}
            unoptimized={img?.startsWith('http') && !img?.includes('images.unsplash.com')}
          />
        </div>
      ))}
    </div>
  </div>
)}
    </>
  );
}

export default memo(PropertyGallery);
