import { client } from "./client";

// Fetch all products
export const getAllProducts = async () => {
  return client.fetch(`
    *[_type == "product" && inStock == true] {
      _id,
      name,
      slug,
      price,
      comparePrice,
      stock,
      featured,
      tags,
      
      "images": images[]{
        "url": asset->url,
        alt
      },
      description
    }
  `);
};

// Fetch featured products only
export const getFeaturedProducts = async () => {
  return client.fetch(`
    *[_type == "product" && featured == true && inStock == true][0...8] {
      _id, name, slug, price, comparePrice,
      "image": images[0].asset->url + "?w=600&h=804&fit=crop&auto=format",
          }
  `);
};

// Fetch single product by slug
export const getProductBySlug = async (slug: string) => {
  return client.fetch(
    `
    *[_type == "product" && slug.current == $slug][0] {
      _id, name, price, comparePrice, description,
      stock, inStock, tags, tailored,
      
      "images": images[]{
        "url": asset->url + "?w=800&h=1200&fit=crop&auto=format",
        alt
      }
    }
  `,
    { slug },
  );
};

export const getProducts = async (page = 1, perPage = 12) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const [products, total] = await Promise.all([
    client.fetch(
      `
      *[_type == "product" && inStock == true && tailored != true] | order(_createdAt desc) [$start...$end] {
        _id,
        name,
        "slug": slug.current,
        price,
        comparePrice,
        "image": images[0].asset->url + "?w=600&h=804&fit=crop&auto=format",
        
      }
    `,
      { start, end },
    ),
    client.fetch(`count(*[_type == "product" && inStock == true])`),
  ]);

  return { products, total, pages: Math.ceil(total / perPage) };
};

// Fetch tailored products add pagination
export const getTailoredProducts = async (page = 1, perPage = 12) => {
  const start = (page - 1) * perPage;
  const end = start + perPage;

  const [products, total] = await Promise.all([
    client.fetch(
      `
      *[_type == "product" && tailored == true && inStock == true] | order(_createdAt desc) [$start...$end] {
        _id,
        name,
        "slug": slug.current,
        price,
        tailored,
        comparePrice,
        "image": images[0].asset->url + "?w=600&h=804&fit=crop&auto=format",
        
      }
    `,
      { start, end },
    ),
    client.fetch(
      `count(*[_type == "product" && tailored == true && inStock == true])`,
    ),
  ]);

  return { products, total, pages: Math.ceil(total / perPage) };
};
