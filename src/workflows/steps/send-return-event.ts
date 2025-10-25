import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { IKlaviyoService, KLAVIYO_MODULE } from "../../types/klaviyo";
import { v4 as uuidv4 } from "uuid";

type ReturnEventInput = {
  order: any;
  returnData: any;
  eventName: "Return Requested" | "Return Received";
};

const sendReturnEventStep = createStep(
  "send-return-event",
  async (input: ReturnEventInput, context) => {
    const { order, returnData, eventName } = input;
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
        returnId: returnData.id,
        status: returnData.status,
        refundAmount: returnData.refund_amount,
        currency: order.currency_code,
        items: (returnData.items || []).map((item: any) => ({
          id: item.item_id,
          quantity: item.quantity,
          reason: item.reason_id || item.note,
        })),
      },
      metric: {
        data: {
          type: "metric",
          attributes: {
            name: eventName,
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
      `${eventName} event sent to Klaviyo for order ${order.id}`,
      event
    );
  }
);

export default sendReturnEventStep;

