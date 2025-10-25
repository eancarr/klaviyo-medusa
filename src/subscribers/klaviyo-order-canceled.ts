import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendOrderCanceledToKlaviyoWorkflow } from "../workflows";

export default async function klaviyoOrderCanceledHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const orderId = data.id;

  try {
    const query = container.resolve("query");
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
      console.error(`Order ${orderId} not found`);
      return;
    }

    await sendOrderCanceledToKlaviyoWorkflow(container).run({
      input: {
        order,
      },
    });
  } catch (error) {
    console.error(
      `Failed to send order canceled event to Klaviyo for order ${orderId}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.canceled",
};

