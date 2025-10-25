# Testing Klaviyo Integration

This guide explains how to test all the Klaviyo tracking features to ensure events are being sent correctly.

## Prerequisites

1. Ensure your `KLAVIYO_API_KEY` is set in your environment variables
2. Have access to your Klaviyo account to view events
3. Medusa backend is running with the plugin installed

## Where to View Events in Klaviyo

### Activity Feed
1. Log into Klaviyo
2. Navigate to **Audience** → **Profiles**
3. Search for a test customer's email
4. Click on the profile
5. Go to the **Activity Feed** tab
6. You should see all events tracked for that profile

### Metrics
1. Navigate to **Analytics** → **Metrics**
2. You should see all custom metrics (events) being tracked:
   - Placed Order
   - Order Shipped
   - Order Canceled
   - Order Delivered
   - Return Requested
   - Return Received
   - Added to Cart
   - Started Checkout

## Testing Each Feature

### 1. Customer Sync

**Test customer.created:**
```bash
# Create a new customer via Medusa admin or API
curl -X POST http://localhost:9000/store/customers \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "first_name": "Test",
    "last_name": "Customer",
    "password": "password123"
  }'
```

**Expected Result:** Customer profile created in Klaviyo with email, name, and custom properties.

**Test customer.updated:**
```bash
# Update customer metadata with marketing consent
curl -X POST http://localhost:9000/store/customers/me \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {customer_token}" \
  -d '{
    "metadata": {
      "klaviyo": {
        "consent": {
          "email_marketing": true
        }
      }
    }
  }'
```

**Expected Result:** Customer profile updated in Klaviyo and subscribed to email list.

---

### 2. Order Placed

**Test via storefront:**
1. Add products to cart
2. Complete checkout
3. Place an order

**Test via admin:**
```bash
# Use Medusa admin to create a draft order and mark it as paid
```

**Expected Result:** 
- "Placed Order" event appears in Klaviyo
- Includes order ID, total, currency, items with details

---

### 3. Order Shipped

**Test via admin:**
1. Go to Medusa admin → Orders
2. Select an order
3. Click "Create Fulfillment"
4. Enter tracking number (optional)
5. Confirm fulfillment

**Expected Result:**
- "Order Shipped" event appears in Klaviyo
- Includes tracking number, carrier, fulfillment ID
- Includes all order items

**Monitor logs:**
```bash
# Watch Medusa backend logs for confirmation
tail -f medusa.log | grep "Klaviyo"
```

---

### 4. Order Canceled

**Test via admin:**
1. Go to Medusa admin → Orders
2. Select an order
3. Click "Cancel Order"
4. Confirm cancellation

**Expected Result:**
- "Order Canceled" event appears in Klaviyo
- Includes cancellation date, refund amount
- Shows all canceled items

---

### 5. Order Delivered (Completed)

**Test via admin:**
1. Go to Medusa admin → Orders
2. Select an order (must have fulfillment)
3. Mark order as complete/delivered

**Expected Result:**
- "Order Delivered" event appears in Klaviyo
- Includes completion date, order total
- Shows all delivered items

---

### 6. Return Requested

**Test via storefront or admin:**
1. Navigate to order details
2. Initiate a return
3. Select items to return
4. Submit return request

**Expected Result:**
- "Return Requested" event appears in Klaviyo
- Includes return ID, items, reasons
- Shows refund amount

---

### 7. Return Received

**Test via admin:**
1. Go to Medusa admin → Returns
2. Select a return
3. Mark return as "Received"

**Expected Result:**
- "Return Received" event appears in Klaviyo
- Includes return details and status

---

### 8. Added to Cart

**Test via storefront:**
1. Browse to a product page
2. Click "Add to Cart"
3. Ensure you're logged in or have entered email at checkout

**Note:** Cart events only track after email is provided (logged in user or guest who entered email).

**Expected Result:**
- "Added to Cart" event appears in Klaviyo
- Includes product ID, name, price, quantity
- Shows cart total and item count

**Important:** The first time you add to cart after the server starts, the event may not fire (need to establish baseline). Subsequent additions will be tracked.

---

### 9. Started Checkout

**Test via storefront:**
1. Add items to cart
2. Navigate to checkout page
3. Enter shipping address
4. Submit address form

**Expected Result:**
- "Started Checkout" event appears in Klaviyo
- Includes all cart items and totals
- Only fires once per cart when shipping address is first added

---

## Debugging

### Check Medusa Logs

```bash
# View real-time logs
tail -f medusa.log | grep -i klaviyo

# Search for specific events
grep "sent to Klaviyo" medusa.log
grep "Failed to send" medusa.log
```

### Common Issues

1. **Events not appearing in Klaviyo:**
   - Check `KLAVIYO_API_KEY` is set correctly
   - Verify API key has proper permissions in Klaviyo
   - Check Medusa logs for errors

2. **Cart events not firing:**
   - Ensure customer has email in cart
   - Remember: In-memory state is lost on server restart
   - First add to cart may not trigger event (baseline needed)

3. **Return events failing:**
   - Verify order has proper return request
   - Check that order module is resolving correctly

### Testing API Key

```bash
# Test if Klaviyo API key is working
curl -X GET https://a.klaviyo.com/api/accounts/ \
  -H "Authorization: Klaviyo-API-Key YOUR_API_KEY" \
  -H "revision: 2024-10-15"
```

### Event Payload Structure

All events sent to Klaviyo follow this structure:

```json
{
  "properties": {
    // Event-specific data
  },
  "metric": {
    "data": {
      "type": "metric",
      "attributes": {
        "name": "Event Name"
      }
    }
  },
  "profile": {
    "data": {
      "type": "profile",
      "attributes": {
        "email": "customer@example.com"
      }
    }
  },
  "unique_id": "uuid-v4"
}
```

## Building Flows in Klaviyo

Once events are working, you can create automated flows:

### Abandoned Cart Flow
1. Trigger: "Started Checkout" event
2. Wait condition: 1 hour
3. Filter: Has not completed order
4. Send email with cart details

### Order Shipped Notification
1. Trigger: "Order Shipped" event
2. Send immediately
3. Include tracking number in email

### Post-Purchase Flow
1. Trigger: "Placed Order" event
2. Wait: 3 days
3. Send review request email

### Return Follow-up
1. Trigger: "Return Received" event
2. Wait: 1 day
3. Send refund confirmation email

## Performance Considerations

### Cart Event Memory Store

The cart subscriber uses an in-memory Map to track cart state. In production:

**Limitations:**
- State is lost on server restart
- Not shared across multiple server instances
- First cart update won't trigger "Added to Cart"

**Production Solutions:**
1. Use Redis to store cart state
2. Store state in cart metadata (requires updating cart)
3. Accept that first event may be missed (Klaviyo deduplication helps)

### Example Redis Implementation

```typescript
// Instead of in-memory Map
const cartStateStore = new Map();

// Use Redis
const redis = container.resolve("redis");
await redis.set(`cart:${cartId}:state`, JSON.stringify(state));
const previousState = JSON.parse(await redis.get(`cart:${cartId}:state`));
```

## Next Steps

After verifying events are tracked correctly:

1. Build automated email flows in Klaviyo
2. Create customer segments based on events
3. Set up A/B testing for email campaigns
4. Monitor metrics and conversion rates
5. Refine event tracking based on business needs

