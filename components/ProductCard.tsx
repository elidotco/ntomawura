import React from "react";

interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image: string;
  category?: string;
}

const ProductCard = ({ data }: { data: ProductCardData }) => {
  return (
    <div className="cursor-pointer group">
      <div className="overflow-hidden bg-[#f5f0ea] aspect-[12/16]">
        <img
          src={data.image}
          alt={data.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="flex justify-between items-center py-4">
        <div>
          <p className="text-sm font-medium">{data.name}</p>
          {data.category && (
            <p className="text-xs text-gray-400 tracking-widest mt-0.5">
              {data.category}
            </p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm">GH₵ {data.price.toFixed(2)}</p>
          {data.comparePrice && (
            <p className="text-xs text-gray-400 line-through">
              GH₵ {data.comparePrice.toFixed(2)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
