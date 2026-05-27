import React from "react";

const Footer = () => {
  return (
    <footer className=" relative  ">
      <div className="absolute bottom-0 w-full flex items-center justify-center py-6">
        <p className="text-sm tracking-widest text-[#faf8f5] font-light">
          © {new Date().getFullYear()} Ntomawura. All rights reserved.
        </p>
      </div>
      <img
        src="/footer.png"
        className="h-auto lg:h-[100vh] w-full object-fit"
        alt=""
      />
    </footer>
  );
};

export default Footer;
