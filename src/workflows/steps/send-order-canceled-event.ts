import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { IKlaviyoService, KLAVIYO_MODULE } from "../../types/klaviyo";
import { v4 as uuidv4 } from "uuid";

type OrderCanceledInput = {
  order: any;
};

const sendOrderCanceledEventStep = createStep(
  "send-order-canceled-event",
  async (input: OrderCanceledInput, context) => {
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
        canceledAt: order.canceled_at || new Date().toISOString(),
        refundAmount: order.original_total || order.total,
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
            name: "Order Canceled",
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
      `Order canceled event sent to Klaviyo for order ${order.id}`,
      event
    );
  }
);

export default sendOrderCanceledEventStep;

