"use client";

import { useState } from "react";

export default function PropertyGallery({ images = [] }) {
  // fallback images until API wired
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
      <section className="hidden md:block bg-black">
        <div className="max-w-[1800px] mx-auto grid grid-cols-4 gap-2 h-[520px] px-2 pt-20">

          {/* MAIN IMAGE */}
          <div className="col-span-2 h-full relative">
            <img
              src={gallery[0]}
              alt="Property"
              className="h-full w-full object-cover rounded-lg"
            />
          </div>

          {/* SIDE IMAGES */}
          <div className="col-span-2 grid grid-cols-2 grid-rows-2 gap-2">
            {gallery.slice(1, 5).map((img, i) => (
              <div key={i} className="relative">
                <img
                  src={img}
                  alt="Property"
                  className="h-full w-full object-cover rounded-lg"
                />

                {/* VIEW ALL OVERLAY */}
                {i === 3 && (
                  <button
                    onClick={() => setOpen(true)}
                    className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-sm font-semibold rounded-lg hover:bg-black/60 transition"
                  >
                    View All Photos
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOBILE GALLERY */}
      <section className="md:hidden pt-20">
        <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-4">
          {gallery.map((img, i) => (
            <div
              key={i}
              className="min-w-[85%] snap-center overflow-hidden rounded-xl"
            >
              <img
                src={img}
                alt="Property"
                className="h-[260px] w-full object-cover"
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
            className="absolute top-6 right-6 text-white text-sm"
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
