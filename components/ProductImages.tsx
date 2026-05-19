"use client";

import { useState } from "react";
import Image from "next/image";

interface ProductImage {
  url: string;
  alt?: string;
}

interface Props {
  images: ProductImage[];
  name: string;
}

export default function ProductImages({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return (
      <div className="bg-[#f5f0ea] flex items-center justify-center min-h-[500px]">
        <span className="text-sm text-gray-400 tracking-widest">NO IMAGE</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div
        className="relative bg-[#f5f0ea] overflow-hidden"
        style={{ minHeight: "520px" }}
      >
        <img
          src={images[active].url}
          alt={images[active].alt || name}
          //  fill
          className="object-cover"
          //  priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {images.length > 1 && (
        <div className="flex gap-2 p-3 border-t border-gray-100 bg-white">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded overflow-hidden border-2 transition-colors ${
                i === active ? "border-black" : "border-transparent"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.alt || `${name} ${i + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
