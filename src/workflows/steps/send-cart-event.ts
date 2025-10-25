import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk";
import { IKlaviyoService, KLAVIYO_MODULE } from "../../types/klaviyo";
import { v4 as uuidv4 } from "uuid";

type CartEventInput = {
  cart: any;
  eventName: "Added to Cart" | "Started Checkout";
  addedItem?: any; // For "Added to Cart" event
};

const sendCartEventStep = createStep(
  "send-cart-event",
  async (input: CartEventInput, context) => {
    const { cart, eventName, addedItem } = input;
    const klaviyoService =
      context.container.resolve<IKlaviyoService>(KLAVIYO_MODULE);

    const email = cart.email;

    console.log(`[Klaviyo Cart Step] Attempting to send "${eventName}" for cart ${cart.id}, email: ${email}`);

    if (!email) {
      // For cart events, email might not be available yet
      // This is fine - we'll track once they provide email
      console.log(`[Klaviyo Cart Step] No email available for cart ${cart.id}, skipping`);
      return new StepResponse("No customer email available yet", null);
    }

    let properties: any = {
      cartId: cart.id,
      cartTotal: cart.total,
      itemCount: cart.items?.length || 0,
      currency: cart.currency_code,
    };

    if (eventName === "Added to Cart" && addedItem) {
      // Specific properties for "Added to Cart"
      properties = {
        ...properties,
        productId: addedItem.product_id,
        variantId: addedItem.variant_id,
        productName: addedItem.title,
        quantity: addedItem.quantity,
        price: addedItem.unit_price,
        thumbnail: addedItem.thumbnail,
      };
    } else if (eventName === "Started Checkout") {
      // Properties for "Started Checkout"
      properties.items = (cart.items || []).map((item: any) => ({
        id: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        price: item.unit_price,
        product_id: item.product_id,
        thumbnail: item.thumbnail,
      }));
    }

    // Construct the event payload
    const eventPayload = {
      properties,
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
    console.log(`[Klaviyo Cart Step] Sending event to Klaviyo:`, JSON.stringify(eventPayload, null, 2));
    const event = await klaviyoService.createEvent(eventPayload);

    console.log(`[Klaviyo Cart Step] Successfully sent "${eventName}" to Klaviyo for cart ${cart.id}`);
    return new StepResponse(
      `${eventName} event sent to Klaviyo for cart ${cart.id}`,
      event
    );
  }
);

export default sendCartEventStep;

