import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendOrderShippedToKlaviyoWorkflow } from "../workflows";

export default async function klaviyoOrderFulfillmentCreatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; order_id: string }>) {
  const fulfillmentId = data.id;
  const orderId = data.order_id;

  try {
    const query = container.resolve("query");
    
    // Get the fulfillment details
    const fulfillmentModuleService = container.resolve("fulfillment");
    const fulfillment = await fulfillmentModuleService.retrieveFulfillment(
      fulfillmentId,
      {
        relations: ["shipping_option"],
      }
    );

    // Get the order details
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "*",
        "items.*",
        "shipping_address.*",
        "billing_address.*",
        "customer.email",
      ],
      filters: {
        id: orderId,
      },
      pagination: {
        take: 1,
        skip: 0,
      },
    });

    if (!order) {
      console.error(`Order ${orderId} not found for fulfillment ${fulfillmentId}`);
      return;
    }

    await sendOrderShippedToKlaviyoWorkflow(container).run({
      input: {
        order,
        fulfillment,
      },
    });
  } catch (error) {
    console.error(
      `Failed to send order shipped event to Klaviyo for order ${orderId}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.fulfillment_created",
};

