import About from "@/sections/About";
import Collection from "@/sections/Collection";
import Hero from "@/sections/Hero";
import Packages from "@/sections/Packages";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Hero />
      <Collection />
      <About />
      <Packages />
    </>
  );
}
