import React from "react";

const Footer = () => {
  return (
    <footer className=" min-h-[90vh] lg:min-h-[60vh] relative bottom-0">
      Footer
      <div className="text-[15vw]  text-[#faf8f5] z-10 absolute w-full  flex items-center flex-col-reverse lg:flex-row justify-between overflow-hidden">
        <img
          src="/logoc.png"
          alt="Stylized brand tag logo centered in a dark footer section"
          className="xl:w-1/4 h-auto object-cover overflow o"
        />
        <img
          src="/taggg.png"
          alt="Stylized brand tag logo centered in a dark footer section"
          className="xl:w-1/3 h-auto object-cover overflow o"
        />
      </div>
      <div
        aria-hidden="true"
        className={`absolute inset-0  bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300 opacity-100 pointer-events-auto
        `}
      />
    </footer>
  );
};

export default Footer;
