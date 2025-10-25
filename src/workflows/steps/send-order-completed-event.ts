import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { IKlaviyoService, KLAVIYO_MODULE } from "../../types/klaviyo";
import { v4 as uuidv4 } from "uuid";

type OrderCompletedInput = {
  order: any;
};

const sendOrderCompletedEventStep = createStep(
  "send-order-completed-event",
  async (input: OrderCompletedInput, context) => {
    const { order } = input;
    const klaviyoService =
      context.container.resolve<IKlaviyoService>(KLAVIYO_MODULE);

    const email = order.email;

    if (!email) {
      return new StepResponse("No customer email available", null);
    }

    // Construct the event payload
    const eventPayload = {
      properties: {
        orderId: order.id,
        orderNumber: order.display_id || order.id,
        completedAt: new Date().toISOString(),
        total: order.total,
        currency: order.currency_code,
        items: (order.items || []).map((item: any) => ({
          id: item.variant_id,
          title: item.title,
          quantity: item.quantity,
          price: item.unit_price,
          product_id: item.product_id,
          thumbnail: item.thumbnail,
        })),
      },
      metric: {
        data: {
          type: "metric",
          attributes: {
            name: "Order Delivered",
          },
        },
      },
      profile: {
        data: {
          type: "profile",
          attributes: {
            email,
          },
        },
      },
      unique_id: uuidv4(),
    };

    // Send the event to Klaviyo
    const event = await klaviyoService.createEvent(eventPayload);

    return new StepResponse(
      `Order delivered event sent to Klaviyo for order ${order.id}`,
      event
    );
  }
);

export default sendOrderCompletedEventStep;

