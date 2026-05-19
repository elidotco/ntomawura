import React from "react";

const Hero = () => {
  return (
    <section className="  h-[calc(100vh-72px)] hero flex flex-col items-center justify-center ">
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
