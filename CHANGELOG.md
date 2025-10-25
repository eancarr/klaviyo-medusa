# Changelog

All notable changes to the Klaviyo Medusa plugin will be documented in this file.

## [0.2.2] - 2024-10-25

### Added

#### Advanced Order Events
- **Order Shipped** tracking via `order.fulfillment_created` event
  - Includes tracking number, carrier, and fulfillment details
  - Automatically triggered when fulfillments are created in Medusa admin
- **Order Canceled** tracking via `order.canceled` event
  - Includes cancellation date and refund amount
  - Tracks all canceled items
- **Order Delivered** tracking via `order.completed` event
  - Triggered when orders are marked as complete

#### Return Event Tracking
- **Return Requested** tracking via `order.return_requested` event
  - Includes return items, quantities, and reasons
  - Tracks refund amounts
- **Return Received** tracking via `order.return_received` event
  - Triggered when returns are marked as received in admin

#### Behavioral Cart Tracking (Server-Side)
- **Added to Cart** tracking via `cart.updated` event
  - Tracks product additions with full product details
  - Works for logged-in users immediately
  - Retrospective tracking for guests when email is added
- **Started Checkout** tracking via `cart.updated` event
  - Triggered when shipping address is first entered
  - Includes all cart items and totals

### New Files
- `subscribers/klaviyo-order-fulfillment-created.ts`
- `subscribers/klaviyo-order-canceled.ts`
- `subscribers/klaviyo-order-completed.ts`
- `subscribers/klaviyo-return-requested.ts`
- `subscribers/klaviyo-return-received.ts`
- `subscribers/klaviyo-cart-updated.ts`
- `workflows/workflows/send-order-shipped-to-klaviyo.ts`
- `workflows/workflows/send-order-canceled-to-klaviyo.ts`
- `workflows/workflows/send-order-completed-to-klaviyo.ts`
- `workflows/workflows/send-return-to-klaviyo.ts`
- `workflows/workflows/send-cart-event-to-klaviyo.ts`
- `workflows/steps/send-order-shipped-event.ts`
- `workflows/steps/send-order-canceled-event.ts`
- `workflows/steps/send-order-completed-event.ts`
- `workflows/steps/send-return-event.ts`
- `workflows/steps/send-cart-event.ts`

### Documentation
- Updated README.md with comprehensive feature list
- Added TESTING.md with detailed testing guide
- Added TEST-CART-TRACKING.md with cart-specific testing instructions
- Added debug logging to cart tracking for easier troubleshooting

### Technical Details
- All events tracked server-side for reliability (cannot be blocked by ad blockers)
- Cart tracking uses in-memory state management (Redis recommended for production at scale)
- All events follow Klaviyo's standard event structure with unique IDs for deduplication
- Comprehensive error handling and logging

### Use Cases Enabled
- Abandoned cart recovery flows
- Order shipment notifications with tracking
- Post-delivery review requests
- Cancellation win-back campaigns
- Return management automation
- Product recommendation based on cart activity
- Customer lifecycle segmentation

### Breaking Changes
None. This is a backwards-compatible feature addition.

---

## [0.2.1] - Previous Release

### Features
- Customer sync on creation and updates
- Order placed event tracking
- Product feed for Klaviyo catalog sync
- Marketing consent management
- Multi-currency product feed support

