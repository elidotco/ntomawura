import ProductCard from "@/components/ProductCard";
import { getAllProducts, getFeaturedProducts } from "@/sanity/lib/queries";

import React from "react";

const Collection = async () => {
  const products = await getFeaturedProducts();

  return (
    <section className="min-h-[50vh] lg:py-20 py-10 " id="collection">
      {/* headline */}
      <div className=" mx-auto px-10  max-w-7xl">
        <div className=" flex w-full mb-20 justify-between items-center">
          <h2 className="lg:text-2xl"> Newest Collection</h2>
          <a
            href="/shop"
            className="py-2 md:py-4 uppercase px-6 md:px-10  bg-black  text-[#f0ece5]"
          >
            see all
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {products.map((product: (typeof products)[number]) => (
            <a href={`/shop/${product.slug.current}`} key={product._id}>
              <ProductCard key={product._id} data={product} />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Collection;
