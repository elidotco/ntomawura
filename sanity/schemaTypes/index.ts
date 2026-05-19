import { type SchemaTypeDefinition } from "sanity";
import product from "../schemas/products";

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [product],
};
