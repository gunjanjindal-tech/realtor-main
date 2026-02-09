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

  return (
    <>
      {/* DESKTOP GALLERY */}
      {/* HEADER TRANSPARENT SUPPORT STRIP */}
        <div className="absolute top-0 left-0 w-full h-20 bg-[#0A1F44] " />
      <section className="hidden md:block relative mt-[96px]">

        <div className="max-w-[1800px] mx-auto px-2 ">
          
          {/* FIXED HEIGHT SECTION */}
          <div className="grid grid-cols-4 gap-2 h-[520px] ">

            {/* MAIN IMAGE */}
            <div className="col-span-2 h-full rounded-lg overflow-hidden">
              <img
                src={gallery[0]}
                alt="Property"
                className="w-full h-full object-cover"
              />
            </div>

            {/* SIDE IMAGES */}
            <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2 h-full">
              {gallery.slice(1, 5).map((img, i) => (
                <div
                  key={i}
                  className="h-full w-full rounded-lg overflow-hidden relative"
                >
                  <img
                    src={img}
                    alt="Property"
                    className="w-full h-full object-cover"
                  />

                  {i === 3 && (
                    <button
                      onClick={() => setOpen(true)}
                      className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold hover:bg-black/60 transition"
                    >
                      View All Photos
                    </button>
                  )}
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* MOBILE */}
      <section className="md:hidden mt-6">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory px-4">
          {gallery.map((img, i) => (
            <div
              key={i}
              className="min-w-[85%] h-[260px] snap-center rounded-xl overflow-hidden"
            >
              <img
                src={img}
                alt="Property"
                className="w-full h-full object-cover"
              />
            </div>
          ))}
        </div>
      </section>

      {/* FULLSCREEN MODAL */}
      {open && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center">
          <button
            onClick={() => setOpen(false)}
            className="absolute top-6 right-6 text-white"
          >
            ✕ Close
          </button>

          <div className="max-w-6xl w-full px-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto max-h-[90vh]">
            {gallery.map((img, i) => (
              <img
                key={i}
                src={img}
                alt="Property"
                className="w-full rounded-lg object-cover"
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}