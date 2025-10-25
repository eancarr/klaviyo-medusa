import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendReturnToKlaviyoWorkflow } from "../workflows";

export default async function klaviyoReturnRequestedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string; order_id: string }>) {
  const returnId = data.id;
  const orderId = data.order_id;

  try {
    const query = container.resolve("query");
    
    // Get the order details
    const {
      data: [order],
    } = await query.graph({
      entity: "order",
      fields: [
        "*",
        "items.*",
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
      console.error(`Order ${orderId} not found for return ${returnId}`);
      return;
    }

    // Get return details
    const orderModuleService = container.resolve("order");
    const returnData = await orderModuleService.retrieveReturn(returnId, {
      relations: ["items"],
    });

    await sendReturnToKlaviyoWorkflow(container).run({
      input: {
        order,
        returnData,
        eventName: "Return Requested",
      },
    });
  } catch (error) {
    console.error(
      `Failed to send return requested event to Klaviyo for order ${orderId}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "order.return_requested",
};

