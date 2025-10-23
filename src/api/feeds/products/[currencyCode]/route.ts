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
    
    // Get the storefront URL from environment variable
    const baseUrl = process.env.STOREFRONT_URL || 'http://localhost:3000';

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
  logger.info('=== DEBUG: Product Feed Brand Data ===');
  logger.info(`Total products: ${products.length}`);
  if (products.length > 0) {
    logger.info(`First product ID: ${products[0].id}`);
    logger.info(`First product title: ${products[0].title}`);
    logger.info(`First product brand object: ${JSON.stringify(products[0].brand, null, 2)}`);
    logger.info(`First product keys: ${Object.keys(products[0]).join(', ')}`);
    logger.info(`First product metadata: ${JSON.stringify(products[0].metadata, null, 2)}`);
    logger.info(`First product images: ${JSON.stringify(products[0].images, null, 2)}`);
    logger.info(`First product thumbnail: ${products[0].thumbnail}`);
  }
  logger.info('======================================');

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

    // Safely extract image URLs
    const imageUrls: string[] = [];
    if (product.images && Array.isArray(product.images)) {
      product.images.forEach(img => {
        if (img && img.url && typeof img.url === 'string') {
          imageUrls.push(img.url);
        }
      });
    }
    
    // Fallback to thumbnail if no images
    if (imageUrls.length === 0 && product.thumbnail) {
      imageUrls.push(product.thumbnail);
    }

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
      // images: imageUrls, // Temporarily commented out
      categories: product.categories.map((category) => category.name),
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  });

    res.json(productsWithCalculatedPrice);
  } catch (error) {
    const logger = req.scope.resolve("logger");
    logger.error('Error in product feed:', error);
    res.status(500).json({ 
      error: 'Failed to generate product feed',
      message: error.message 
    });
  }
}
