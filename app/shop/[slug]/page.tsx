import { notFound } from "next/navigation";
import { getProductBySlug } from "@/sanity/lib/queries";
import ProductImages from "@/components/ProductImages";
import ProductInfo from "@/components/ProductInfo";

interface Props {
  params: { slug: string };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  console.log(slug);
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  return (
    <main className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 min-h-screen">
      <ProductImages images={product.images} name={product.name} />
      <ProductInfo product={product} />
    </main>
  );
}
