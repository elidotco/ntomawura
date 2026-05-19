import React from "react";

const Footer = () => {
  return (
    <footer className="min-h-[50vh] relative bottom-0">
      Footer
      <div className="text-[15vw] text-[#faf8f5] z-10 absolute w-full  flex items-center justify-center">
        Ntomawura
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
