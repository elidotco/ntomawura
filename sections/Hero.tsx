"use client";
import React, { useEffect, useRef, useState } from "react";

const images = ["/hero1.png", "/hero2.png"];

const Hero = () => {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goTo = (index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent(index);
      setIsTransitioning(false);
    }, 400);
  };

  const next = () => goTo((current + 1) % images.length);

  useEffect(() => {
    intervalRef.current = setInterval(next, 4000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current]);

  return (
    <section className="relative w-full overflow-hidden">
      {/* Slides */}
      <div
        className="relative w-full h-auto lg:h-[100vh] transition-opacity duration-500"
        style={{ opacity: isTransitioning ? 0 : 1 }}
      >
        <img
          src={images[current]}
          className="w-full h-auto lg:h-[100vh] object-cover"
          alt={`Slide ${current + 1}`}
        />
      </div>

      {/* Dot indicators */}
      {/* <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {images.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-white"
                : "w-2 h-2 bg-white/40 hover:bg-white/70"
            }`}
          />
        ))}
      </div> */}
    </section>
  );
};

export default Hero;
