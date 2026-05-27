"use client";
import { useCart } from "@/lib/context/CartContext";
import Cart from "@/sections/Cart";
import React, { useEffect, useState } from "react";
import { HiOutlineX } from "react-icons/hi";
import { HiOutlineBars3 } from "react-icons/hi2";

const CartIcon = () => (
  <svg
    width="22"
    height="22"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <path d="M16 10a4 4 0 01-8 0" />
  </svg>
);

const HamburgerIcon = ({ isOpen }: { isOpen: boolean }) => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
  >
    <style>{`
      .bar-top {
        transform-origin: center;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
        transform: ${isOpen ? "translateY(6px) rotate(45deg)" : "none"};
      }
      .bar-mid {
        transition: opacity 0.2s;
        opacity: ${isOpen ? 0 : 1};
      }
      .bar-bot {
        transform-origin: center;
        transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s;
        transform: ${isOpen ? "translateY(-6px) rotate(-45deg)" : "none"};
      }
    `}</style>
    <line className="bar-top" x1="3" y1="6" x2="21" y2="6" />
    <line className="bar-mid" x1="3" y1="12" x2="21" y2="12" />
    <line className="bar-bot" x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isCartOpen, setIsCartOpen] = React.useState(false);
  const [cartCount] = React.useState(2);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  const count = useCart()?.count || 0;
  const closeAll = () => {
    setIsMenuOpen(false);
    setIsCartOpen(false);
  };
  const overlayVisible = isMenuOpen || isCartOpen;

  const menuItems = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
    { name: "Styles", path: "/styles" },
    { name: "Tailored", path: "/tailored" },
    { name: "Contact", path: "/contact" },
  ];

  React.useEffect(() => {
    if (overlayVisible) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [overlayVisible]);

  return (
    <>
      <header
        className={` z-50 fixed w-full ${scrolled ? "bg-[#faf8f5] border border-b-[#e8e2d8]" : "bg-transparent "}`}
      >
        <div className="inner ">
          {/* Logo */}
          <a
            href="/"
            className={`logo text-3xl invisible lg:visible font-bold ${scrolled ? "visible" : "text-white"}`}
          >
            Ntomawura
          </a>

          {/* Desktop Nav */}
          <nav className="desktop-nav" aria-label="Main navigation">
            <ul
              style={{
                display: "flex",
                gap: "2.5rem",
                listStyle: "none",
                margin: 0,
                padding: 0,
              }}
            >
              {menuItems.map((item) => (
                <li className="font-medium" key={item.name}>
                  <a href={item.path}>{item.name}</a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Controls */}
          <div className="controls">
            <button
              className="cart-btn"
              aria-label={`Cart, ${cartCount} items`}
              onClick={() => {
                setIsMenuOpen(false);
                setIsCartOpen(!isCartOpen);
              }}
            >
              <CartIcon />
              {cartCount > 0 && (
                <span className="cart-badge" aria-hidden="true">
                  {count}
                </span>
              )}
            </button>

            <button
              className="hamburger-btn lg:hidden"
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={isMenuOpen}
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <HiOutlineX size={20} />
              ) : (
                <HiOutlineBars3 size={20} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        aria-hidden="true"
        onClick={closeAll}
        className={`fixed inset-0 z-80 bg-stone-900/30 backdrop-blur-sm transition-opacity duration-300
        ${overlayVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      />

      {/* Mobile drawer */}
      <nav
        className={`mobile-nav${isMenuOpen ? " open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!isMenuOpen}
      >
        <div className="mobile-nav-header flex ">
          {/* <span className="mobile-nav-logo">Ntomawura</span> */}
          <HiOutlineX
            size={22}
            strokeWidth={1.5}
            className="text-stone-900 "
            onClick={() => setIsMenuOpen(false)}
          />
        </div>

        <ul>
          {menuItems.map((item) => (
            <li key={item.name}>
              <a href={item.path} onClick={() => setIsMenuOpen(false)}>
                {item.name}
              </a>
            </li>
          ))}
        </ul>

        <div className="mobile-nav-footer">
          © {new Date().getFullYear()} Ntomawura
        </div>
      </nav>

      {/*Cart  */}

      <Cart isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />
    </>
  );
};

export default Header;
