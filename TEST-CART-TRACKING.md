# Testing Cart Event Tracking

## The Problem

Cart event tracking is tricky because:
1. **Guest users add items BEFORE providing email** - Most users browse and add to cart anonymously
2. **In-memory state** - The subscriber uses an in-memory Map that loses state on restart
3. **No baseline** - First cart update after restart won't have previous state to compare

## Updated Implementation

The subscriber now includes:
- ✅ Debugging logs to see what's happening
- ✅ Retrospective tracking when email is added
- ✅ Better handling of missing previous state

## How to Test

### Option 1: Test as Logged-In User (Easiest)

1. **Login to your storefront** with vfx@eancarr.net
2. **Watch backend logs:**
   ```bash
   tail -f medusa.log | grep "Klaviyo Cart"
   ```
3. **Add an item to cart**
4. **Check logs** - you should see:
   ```
   [Klaviyo Cart] Cart updated: cart_xxx, email: vfx@eancarr.net, items: 1
   [Klaviyo Cart] Sending "Added to Cart" for item: Product Name
   [Klaviyo Cart Step] Successfully sent "Added to Cart" to Klaviyo
   ```

### Option 2: Test as Guest (Realistic Flow)

1. **Open storefront in incognito/private window**
2. **Watch backend logs:**
   ```bash
   tail -f medusa.log | grep "Klaviyo Cart"
   ```
3. **Add item to cart** - No event sent yet (no email)
   ```
   [Klaviyo Cart] Cart updated: cart_xxx, email: none, items: 1
   ```
4. **Go to checkout and enter email** - Should send retrospective "Added to Cart"
   ```
   [Klaviyo Cart] Email just added, sending retrospective "Added to Cart"
   ```
5. **Enter shipping address** - Should send "Started Checkout"
   ```
   [Klaviyo Cart] Sending "Started Checkout"
   ```

### Option 3: Direct API Test

Test using Medusa API directly:

```bash
# 1. Create a cart
CART_RESPONSE=$(curl -X POST http://localhost:9000/store/carts \
  -H "Content-Type: application/json" \
  -d '{"region_id": "reg_xxx"}')

CART_ID=$(echo $CART_RESPONSE | jq -r '.cart.id')
echo "Cart ID: $CART_ID"

# 2. Add item to cart (won't trigger Klaviyo - no email)
curl -X POST http://localhost:9000/store/carts/$CART_ID/line-items \
  -H "Content-Type: application/json" \
  -d '{
    "variant_id": "var_xxx",
    "quantity": 1
  }'

# 3. Add email to cart (should trigger retrospective "Added to Cart")
curl -X POST http://localhost:9000/store/carts/$CART_ID \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vfx@eancarr.net"
  }'

# 4. Add shipping address (should trigger "Started Checkout")
curl -X POST http://localhost:9000/store/carts/$CART_ID \
  -H "Content-Type: application/json" \
  -d '{
    "shipping_address": {
      "first_name": "Test",
      "last_name": "User",
      "address_1": "123 Test St",
      "city": "Test City",
      "country_code": "us",
      "postal_code": "12345"
    }
  }'
```

## What You Should See in Klaviyo

After testing, go to Klaviyo:
1. **Navigate to:** Audience → Profiles
2. **Search for:** vfx@eancarr.net
3. **Click** on the profile
4. **Go to:** Activity Feed tab

You should see:
- ✅ "Added to Cart" event with product details
- ✅ "Started Checkout" event with cart items

## Troubleshooting

### No events showing up

**Check 1: Is the subscriber running?**
```bash
# Restart your backend to load the subscriber
# Then check logs immediately after adding to cart
tail -f medusa.log | grep "Klaviyo"
```

**Check 2: Does cart have email?**
The subscriber logs will show:
```
[Klaviyo Cart] Cart updated: cart_xxx, email: none, items: 1
```
If email is "none", that's expected for guest users before checkout.

**Check 3: Is there an error?**
Look for:
```
[Klaviyo Cart] Failed to send cart event to Klaviyo
```

**Check 4: Verify Klaviyo API key**
```bash
# Test API key directly
curl -X GET https://a.klaviyo.com/api/accounts/ \
  -H "Authorization: Klaviyo-API-Key $KLAVIYO_API_KEY" \
  -H "revision: 2024-10-15"
```

### Events sent but not in Klaviyo

**Check Klaviyo Metrics:**
1. Go to Analytics → Metrics
2. Look for "Added to Cart" and "Started Checkout" metrics
3. If metrics exist but no events for your profile, check:
   - Email matches exactly
   - Event was sent successfully (check logs)
   - Klaviyo may take a few minutes to process

### First add to cart doesn't work

This is expected! The in-memory store needs a baseline:
1. **First cart update** - Establishes baseline, no event sent
2. **Second item added** - Will trigger event (if email exists)

**Workaround:**
- For logged-in users, the first add should work if they've already added items before
- For guests, retrospective tracking handles this when email is added

## Production Considerations

### Current Limitations

1. **In-memory store** - Lost on server restart
2. **No tracking without email** - Can't track anonymous browsing
3. **Horizontal scaling** - State not shared between instances

### Recommended Improvements

**Option 1: Use Cart Metadata (Simpler)**
Store previous state in `cart.metadata`:
```typescript
// Read previous state
const previousState = cart.metadata?.klaviyo_state;

// Update cart metadata
await cartService.update(cart.id, {
  metadata: {
    ...cart.metadata,
    klaviyo_state: {
      itemCount: currentItemCount,
      hasShippingAddress,
      hasEmail: !!cart.email
    }
  }
});
```

**Option 2: Use Redis (Better for Scale)**
```typescript
const redis = container.resolve("redis");
const key = `klaviyo:cart:${cartId}`;

// Read
const previousState = JSON.parse(await redis.get(key) || '{}');

// Write
await redis.set(key, JSON.stringify(state), 'EX', 86400); // 24h expiry
```

## Expected Behavior Summary

| Action | Email Available? | Event Sent | Notes |
|--------|------------------|------------|-------|
| Add item (logged in) | ✅ Yes | ✅ Added to Cart | Works immediately |
| Add item (guest) | ❌ No | ❌ None | Waiting for email |
| Enter email at checkout | ✅ Yes | ✅ Added to Cart | Retrospective |
| Enter shipping address | ✅ Yes | ✅ Started Checkout | First time only |
| Add another item | ✅ Yes | ✅ Added to Cart | Each additional item |
| Update quantity | ✅ Yes | ❌ None | Only tracks additions |

## Next Steps

1. ✅ **Test with the scenarios above**
2. ✅ **Check Medusa logs** for debugging output
3. ✅ **Verify events in Klaviyo** activity feed
4. 📋 **Consider production improvements** (Redis or metadata)
5. 📧 **Build Klaviyo flows** once events are working

## Need Help?

If events still aren't showing:
1. Share the output from `tail -f medusa.log | grep "Klaviyo Cart"`
2. Confirm KLAVIYO_API_KEY is set
3. Check if other Klaviyo events (order placed) are working

