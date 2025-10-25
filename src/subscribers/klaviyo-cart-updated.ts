import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendCartEventToKlaviyoWorkflow } from "../workflows";

// In-memory store to track previous cart states
// In production, you might want to use Redis or the cart metadata
type CartItemState = { id: string; quantity: number; variantId: string };
const cartStateStore = new Map<string, { 
  itemCount: number; 
  hasShippingAddress: boolean; 
  hasEmail: boolean; 
  items: CartItemState[];
}>();

export default async function klaviyoCartUpdatedHandler({
  event: { data },
  container,
}: SubscriberArgs<{ id: string }>) {
  const cartId = data.id;

  try {
    const query = container.resolve("query");
    
    // Get the cart details with items
    const {
      data: [cart],
    } = await query.graph({
      entity: "cart",
      fields: [
        "*",
        "items.*",
      ],
      filters: {
        id: cartId,
      },
      pagination: {
        take: 1,
        skip: 0,
      },
    });

    if (!cart) {
      console.error(`[Klaviyo Cart] Cart ${cartId} not found`);
      return;
    }

    console.log(`[Klaviyo Cart] Cart updated: ${cartId}, email: ${cart.email || 'none'}, items: ${cart.items?.length || 0}`);
    console.log(`[Klaviyo Cart] Cart items:`, cart.items?.map((item: any) => `${item.title} (id: ${item.id}, variant: ${item.variant_id})`).join(', ') || 'none');

    const currentItemCount = cart.items?.length || 0;
    const hasShippingAddress = !!(cart.shipping_address?.address_1);
    const previousState = cartStateStore.get(cartId);

    console.log(`[Klaviyo Cart] Previous state:`, previousState);
    console.log(`[Klaviyo Cart] Current state: items=${currentItemCount}, hasShipping=${hasShippingAddress}, hasEmail=${!!cart.email}`);

    // If cart now has email but didn't before, check if we should send events
    const emailJustAdded = cart.email && previousState && !previousState.hasEmail;

    // Get current items with quantities
    const currentItems: CartItemState[] = cart.items?.map((item: any) => ({
      id: item.id,
      quantity: item.quantity,
      variantId: item.variant_id,
    })) || [];
    const previousItems = previousState?.items || [];

    // Track "Added to Cart" by detecting new items or quantity increases
    if (cart.email) {
      if (!previousState) {
        // First time seeing this cart - if it has items, track the most recent one
        if (currentItemCount > 0) {
          const lastItem = cart.items?.[cart.items.length - 1];
          if (lastItem) {
            console.log(`[Klaviyo Cart] First time seeing cart with items, tracking most recent: ${lastItem.title}`);
            await sendCartEventToKlaviyoWorkflow(container).run({
              input: {
                cart,
                eventName: "Added to Cart",
                addedItem: lastItem,
              },
            });
          }
        }
      } else {
        // We have previous state - check for new items and quantity increases
        for (const currentItem of currentItems) {
          const previousItem = previousItems.find((item: CartItemState) => item.id === currentItem.id);
          
          if (!previousItem) {
            // Completely new item
            const fullItem = cart.items?.find((item: any) => item.id === currentItem.id);
            if (fullItem) {
              console.log(`[Klaviyo Cart] New item detected: ${fullItem.title}`);
              await sendCartEventToKlaviyoWorkflow(container).run({
                input: {
                  cart,
                  eventName: "Added to Cart",
                  addedItem: fullItem,
                },
              });
            }
          } else if (currentItem.quantity > previousItem.quantity) {
            // Quantity increased on existing item
            const fullItem = cart.items?.find((item: any) => item.id === currentItem.id);
            if (fullItem) {
              const quantityAdded = currentItem.quantity - previousItem.quantity;
              console.log(`[Klaviyo Cart] Quantity increased for ${fullItem.title}: +${quantityAdded} (${previousItem.quantity} → ${currentItem.quantity})`);
              
              // Create a modified item with the added quantity for the event
              const addedItem = {
                ...fullItem,
                quantity: quantityAdded, // Track only the quantity that was added
              };
              
              await sendCartEventToKlaviyoWorkflow(container).run({
                input: {
                  cart,
                  eventName: "Added to Cart",
                  addedItem,
                },
              });
            }
          }
        }
      }
    }

    // Track "Started Checkout" when shipping address is first added AND cart has email
    if (cart.email && hasShippingAddress && (!previousState || !previousState.hasShippingAddress)) {
      console.log(`[Klaviyo Cart] Sending "Started Checkout"`);
      await sendCartEventToKlaviyoWorkflow(container).run({
        input: {
          cart,
          eventName: "Started Checkout",
        },
      });
    }

    // If email was just added and cart has items, send retrospective "Added to Cart" for most recent item
    if (emailJustAdded && currentItemCount > 0) {
      const lastItem = cart.items?.[cart.items.length - 1];
      if (lastItem) {
        console.log(`[Klaviyo Cart] Email just added, sending retrospective "Added to Cart"`);
        await sendCartEventToKlaviyoWorkflow(container).run({
          input: {
            cart,
            eventName: "Added to Cart",
            addedItem: lastItem,
          },
        });
      }
    }

    // Update the cart state in our store
    cartStateStore.set(cartId, {
      itemCount: currentItemCount,
      hasShippingAddress,
      hasEmail: !!cart.email,
      items: currentItems,
    });

    console.log(`[Klaviyo Cart] State updated for cart ${cartId}`);

  } catch (error) {
    console.error(
      `[Klaviyo Cart] Failed to send cart event to Klaviyo for cart ${cartId}:`,
      error
    );
  }
}

export const config: SubscriberConfig = {
  event: "cart.updated",
};

