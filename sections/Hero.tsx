import React from "react";

const Hero = () => {
  return (
    <section className="  h-screen hero flex flex-col items-center justify-center ">
      <img
        src="/logod.png"
        className=" w-1/3 lg:w-1/5 h-auto z-10 spin brightness-50 invert  "
      />
      <h1 className=" text-[3rem] lg:text-[6rem] font-bold text-[#f0ece5]">
        Ntomawura
      </h1>
      <p className="text-xl lg:text-[3rem] text-[#f0ece5]">
        Your Source of Authentic African Prints
      </p>

      <a
        href="/shop"
        className="py-4 uppercase px-10  bg-black mt-5 text-[#f0ece5]"
      >
        shop Now
      </a>
    </section>
  );
};

export default Hero;
