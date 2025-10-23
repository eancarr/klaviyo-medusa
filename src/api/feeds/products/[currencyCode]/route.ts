import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
    const logger = req.scope.resolve("logger");
    const currencyCode = req.params.currencyCode.toLowerCase();
    
    // Get the base URL from the request
    const protocol = req.get('x-forwarded-proto') || req.protocol || 'https';
    const host = req.get('x-forwarded-host') || req.get('host') || 'localhost:9000';
    const baseUrl = `${protocol}://${host}`;

    // Debug: Try to query brands first
    try {
      const { data: brands } = await query.graph({
        entity: "brand",
        fields: ["id", "name"],
      });
      logger.info(`=== Brands in system: ${brands?.length || 0} brands ===`);
      if (brands && brands.length > 0) {
        logger.info(`Sample brand: ${JSON.stringify(brands[0])}`);
      }
    } catch (error) {
      logger.error(`Error querying brands: ${error.message}`);
    }

    const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "description",
      "handle",
      "thumbnail",
      "created_at",
      "updated_at",
      "metadata",
      "variants.*",
      "variants.product.*",
      "variants.prices.*",
      "variants.calculated_price.*",
      "variants.inventory_quantity",
      "images.*",
      "categories.*",
      "brand.*",
    ],
    context: {
      variants: {
        calculated_price: QueryContext({
          currency_code: currencyCode,
        }),
      },
    },
  });

  // Debug: Log detailed product data
  if (products.length > 0) {
    console.log('=== DEBUG: Product Feed Brand Data ===');
    console.log('Total products:', products.length);
    console.log('First product ID:', products[0].id);
    console.log('First product title:', products[0].title);
    console.log('First product brand object:', JSON.stringify(products[0].brand, null, 2));
    console.log('First product keys:', Object.keys(products[0]));
    console.log('First product metadata:', JSON.stringify(products[0].metadata, null, 2));
    console.log('======================================');
  }

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
      link: `${baseUrl}/products/${product.handle}`,
      image_link: product.images?.[0]?.url || product.thumbnail,
      handle: product.handle,
      sku: product.variants?.[0]?.sku || product.id,
      brand: product.brand?.name || "Unknown",
      condition: "new",
      availability: totalInventory > 0 ? "in stock" : "out of stock",
      inventory_quantity: totalInventory,
      price: Math.round(minPrice * 100), // Convert to cents
      compare_at_price: minPrice !== maxPrice ? Math.round(maxPrice * 100) : null,
      currency: currencyCode.toUpperCase(),
      images: product.images?.map(img => img.url) || [product.thumbnail].filter(Boolean),
      categories: product.categories.map((category) => category.name),
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  });

    res.json(productsWithCalculatedPrice);
  } catch (error) {
    console.error('Error in product feed:', error);
    res.status(500).json({ 
      error: 'Failed to generate product feed',
      message: error.message 
    });
  }
}
