const product = {
  name: "product",
  title: "Product",
  type: "document",
  fields: [
    {
      name: "name",
      title: "Product Name",
      type: "string",
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "slug",
      title: "Slug",
      type: "slug",
      options: { source: "name" },
      validation: (Rule: any) => Rule.required(),
    },
    {
      name: "price",
      title: "Price (GHS)",
      type: "number",
      validation: (Rule: any) => Rule.required().positive(),
    },
    {
      name: "comparePrice",
      title: "Compare at Price (GHS)",
      description: "Original price before discount — shows a strikethrough",
      type: "number",
    },

    {
      name: "images",
      title: "Product Images",
      type: "array",
      of: [
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            {
              name: "alt",
              title: "Alt Text",
              type: "string",
            },
          ],
        },
      ],
      validation: (Rule: any) => Rule.required().min(1),
    },
    {
      name: "description",
      title: "Description",
      type: "array",
      of: [{ type: "block" }], // Rich text
    },
    {
      name: "stock",
      title: "Stock Quantity",
      type: "number",
      validation: (Rule: any) => Rule.required().min(0),
    },
    {
      name: "sku",
      title: "SKU",
      description: "Unique product identifier",
      type: "string",
    },
    {
      name: "inStock",
      title: "In Stock",
      type: "boolean",
      initialValue: true,
    },
    {
      name: "featured",
      title: "Featured Product",
      description: "Show on homepage",
      type: "boolean",
      initialValue: false,
    },

    {
      name: "tailored",
      title: "Tailored Product",
      description: "Show on tailored page",
      type: "boolean",
      initialValue: false,
    },
    {
      name: "tags",
      title: "Tags",
      type: "array",
      of: [{ type: "string" }],
      options: { layout: "tags" },
    },
  ],
  preview: {
    select: {
      title: "name",
      media: "images.0",
      price: "price",
      stock: "stock",
    },
    prepare({ title, media, price, stock }: any) {
      return {
        title,
        media,
        subtitle: `GHS ${price} — Stock: ${stock}`,
      };
    },
  },
};

export default product;
