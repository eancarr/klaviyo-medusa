import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import {
  ContainerRegistrationKeys,
  QueryContext,
} from "@medusajs/framework/utils";

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY);
  const currencyCode = req.params.currencyCode.toLowerCase();

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
    return {
      id: product.id,
      title: product.title,
      description: product.description,
      handle: product.handle,
      thumbnail: product.thumbnail,
      image_link: product.images?.[0]?.url,
      from_price: product.variants.reduce((acc, variant) => {
        return Math.min(acc, variant.calculated_price.calculated_amount);
      }, Infinity),
      currency_code: currencyCode,
      url: `https://www.medusajs.com/products/${product.handle}`,
      categories: product.categories.map((category) => category.name),
    };
  });

  res.json(productsWithCalculatedPrice);
}
