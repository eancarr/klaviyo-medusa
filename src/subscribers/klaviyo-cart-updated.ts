import {
  type SubscriberArgs,
  type SubscriberConfig,
} from "@medusajs/framework";
import { sendCartEventToKlaviyoWorkflow } from "../workflows";

// In-memory store to track previous cart states
// In production, you might want to use Redis or the cart metadata
const cartStateStore = new Map<string, { itemCount: number; hasShippingAddress: boolean; hasEmail: boolean; itemIds: string[] }>();

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

    // Get current item IDs
    const currentItemIds = cart.items?.map((item: any) => item.id) || [];
    const previousItemIds = previousState?.itemIds || [];

    // Track "Added to Cart" by detecting new items (compare IDs)
    if (cart.email && previousState) {
      // Find items that are in current cart but weren't in previous state
      const newItemIds = currentItemIds.filter((id: string) => !previousItemIds.includes(id));
      
      if (newItemIds.length > 0) {
        console.log(`[Klaviyo Cart] Detected ${newItemIds.length} new item(s)`);
        
        // Send event for each newly added item
        for (const itemId of newItemIds) {
          const newItem = cart.items?.find((item: any) => item.id === itemId);
          if (newItem) {
            console.log(`[Klaviyo Cart] Sending "Added to Cart" for item:`, newItem.title);
            await sendCartEventToKlaviyoWorkflow(container).run({
              input: {
                cart,
                eventName: "Added to Cart",
                addedItem: newItem,
              },
            });
          }
        }
      } else if (currentItemCount !== previousState.itemCount) {
        console.log(`[Klaviyo Cart] Item count changed but no new items detected. Might be quantity update or item removal.`);
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
      itemIds: currentItemIds,
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

