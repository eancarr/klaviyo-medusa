import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const currencyCode = req.params.currencyCode.toLowerCase();
  
  // Get the base URL from the request
  const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
  const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:9000';
  const baseUrl = `${protocol}://${host}`;

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "*",
      "variants.*",
      "variants.product.*",
      "variants.prices.*",
      "variants.calculated_price.*",
      "images.*",
      "categories.*",
    ],
    context: {
      variants: {
        calculated_price: QueryContext({
          currency_code: currencyCode,
        }),
      },
    },
  });

  const productsWithCalculatedPrice = products.map((product) => {
    const minPrice = product.variants.reduce((acc, variant) => {
      return Math.min(acc, variant.calculated_price.calculated_amount);
    }, Infinity);
    
    const maxPrice = product.variants.reduce((acc, variant) => {
      return Math.max(acc, variant.calculated_price.calculated_amount);
    }, 0);

    // Calculate total inventory across all variants
    const totalInventory = product.variants.reduce((acc, variant) => {
      return acc + (variant.inventory_quantity || 0);
    }, 0);

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      handle: product.handle,
      sku: product.variants?.[0]?.sku || product.id,
      brand: product.metadata?.brand || "Unknown",
      condition: "new",
      availability: totalInventory > 0 ? "in stock" : "out of stock",
      inventory_quantity: totalInventory,
      price: Math.round(minPrice * 100), // Convert to cents
      compare_at_price: minPrice !== maxPrice ? Math.round(maxPrice * 100) : null,
      currency: currencyCode.toUpperCase(),
      image: product.images?.[0]?.url || product.thumbnail,
      images: product.images?.map(img => img.url) || [product.thumbnail].filter(Boolean),
      url: `${baseUrl}/products/${product.handle}`,
      categories: product.categories.map((category) => category.name),
      tags: product.tags?.map(tag => tag.value) || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  });

  res.json(productsWithCalculatedPrice);
}
