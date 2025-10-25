# Release Notes: v0.2.2

## Summary

This release adds **comprehensive event tracking** for the entire customer lifecycle:
- ✅ Advanced order events (shipped, canceled, delivered)
- ✅ Return management tracking
- ✅ Behavioral cart tracking (server-side)

All tracking is done server-side for maximum reliability.

## What's New

### 🚚 Order Lifecycle Tracking
- **Order Shipped** - Tracks fulfillment with tracking numbers
- **Order Canceled** - Tracks cancellations with refund amounts
- **Order Delivered** - Tracks order completion

### 📦 Return Management
- **Return Requested** - Tracks return requests with item details
- **Return Received** - Tracks when returns arrive at warehouse

### 🛒 Cart Behavioral Tracking
- **Added to Cart** - Tracks product additions (server-side)
- **Started Checkout** - Tracks checkout initiation

## Installation

After publishing to npm, users should:

```bash
npm install @eancarr/klaviyo-medusa@0.2.2
# or
yarn add @eancarr/klaviyo-medusa@0.2.2
```

Then restart their Medusa backend:
```bash
npm run dev
```

## Breaking Changes

None - fully backwards compatible.

## New Klaviyo Events

The following events will now appear in Klaviyo:
1. **Order Shipped** - for building shipment notification flows
2. **Order Canceled** - for win-back campaigns
3. **Order Delivered** - for review requests
4. **Return Requested** - for return management
5. **Return Received** - for refund confirmations
6. **Added to Cart** - for product recommendations
7. **Started Checkout** - for abandoned cart recovery

## Documentation

- Full testing guide: `TESTING.md`
- Cart tracking specifics: `TEST-CART-TRACKING.md`
- Updated README with all features
- See `CHANGELOG.md` for technical details

## Known Limitations

### Cart Tracking
- Uses in-memory state (lost on restart)
- For production at scale, consider Redis implementation (see `TEST-CART-TRACKING.md`)
- Requires email in cart (logged-in users or guests who provide email)

## Post-Publication Steps

After publishing to npm, update the main Medusa project:

1. Update package.json dependency:
   ```json
   {
     "dependencies": {
       "@eancarr/klaviyo-medusa": "^0.2.2"
     }
   }
   ```

2. Install the update:
   ```bash
   npm install
   # or yarn install
   ```

3. Restart backend

4. Test with a logged-in user:
   - Add item to cart (establish baseline)
   - Add another item (should trigger event)
   - Check Klaviyo for "Added to Cart" event

5. Watch logs for confirmation:
   ```bash
   tail -f medusa.log | grep "Klaviyo"
   ```

## Support

For issues or questions about cart tracking:
- Check debug logs with `grep "Klaviyo Cart" medusa.log`
- Verify backend shows subscribers: should see "Processing cart.updated which has 1 subscriber"
- See `TEST-CART-TRACKING.md` for detailed troubleshooting

## Files Modified/Added

**New Subscribers (6):**
- klaviyo-order-fulfillment-created.ts
- klaviyo-order-canceled.ts
- klaviyo-order-completed.ts
- klaviyo-return-requested.ts
- klaviyo-return-received.ts
- klaviyo-cart-updated.ts

**New Workflows (5):**
- send-order-shipped-to-klaviyo.ts
- send-order-canceled-to-klaviyo.ts
- send-order-completed-to-klaviyo.ts
- send-return-to-klaviyo.ts
- send-cart-event-to-klaviyo.ts

**New Steps (5):**
- send-order-shipped-event.ts
- send-order-canceled-event.ts
- send-order-completed-event.ts
- send-return-event.ts
- send-cart-event.ts

**Updated Files:**
- workflows/steps/index.ts (exports)
- workflows/index.ts (exports)
- README.md (documentation)
- TESTING.md (new file)
- TEST-CART-TRACKING.md (new file)
- CHANGELOG.md (new file)

