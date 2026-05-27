import { getProducts } from "@/sanity/lib/queries";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { Suspense } from "react";

interface Props {
  searchParams: Promise<{ page?: string }>;
}

export default async function ShopPage({ searchParams }: Props) {
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;

  const { products, pages } = await getProducts(page, 12);

  return (
    <section className="">
      <img
        src="/shop.png"
        className="h-auto lg:h-[auto] w-full object-fit  "
        alt=""
      />
      <div className="shop-background pt-20  min-h-screen">
        <section className="max-w-7xl relative mx-auto px-6 pb-20">
          {products.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-400 z-20 tracking-widest text-sm">
                NO PRODUCTS FOUND
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {products.map((product: (typeof products)[number]) => (
                <a href={`/shop/${product.slug}`} key={product._id}>
                  <ProductCard data={product} />
                </a>
              ))}
            </div>
          )}

          {pages > 1 && (
            <div className="mt-12 z-50 ">
              <Suspense fallback={null}>
                <Pagination currentPage={page} totalPages={pages} />
              </Suspense>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}
