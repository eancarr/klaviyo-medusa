# Klaviyo Integration for Medusa

A Medusa plugin that integrates Klaviyo's email marketing and customer engagement platform with your Medusa store.

> **Note**: This is a fork of [@variablevic/klaviyo-medusa](https://github.com/variablevic/klaviyo-medusa) with feature enhancements including event tracking, return management, cart behavioral tracking, enhanced product feed with brand support, and bulk subscription management.




## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
  - [Configuration Options](#configuration-options)
  - [Environment Variables](#environment-variables)
- [Usage](#usage)
  - [Client-Side Integration](#client-side-integration)
  - [Product Feed](#product-feed)
- [Extending the Plugin](#extending-the-plugin)
- [Local Development](#local-development)
- [License](#license)

## Features

### Customer Management
- Automatically sync customers to Klaviyo when created or updated
- Handle marketing consent for email/SMS subscriptions
- Bulk subscription management based on customer consent metadata
- Support for email and SMS marketing consent
- Transactional SMS consent handling

### Order Tracking
- **Order Placed** - Track when orders are placed with complete order details
- **Order Shipped** - Track fulfillment creation with tracking numbers and carrier info
- **Order Canceled** - Track order cancellations with refund amounts
- **Order Delivered** - Track when orders are completed/delivered

### Return Tracking
- **Return Requested** - Track return requests with item details and reasons
- **Return Received** - Track when returns are received at warehouse

### Behavioral Tracking (Server-Side)
- **Added to Cart** - Track when items are added to cart (with product details)
  - Detects new items and quantity increases
  - Supports retrospective tracking when email is added to cart
  - Works for both logged-in users and guests
  - **Note**: Cart tracking uses in-memory state management. For production at scale, consider implementing Redis-based state management to persist cart state across server restarts.
- **Started Checkout** - Track when customers begin checkout process (triggered when shipping address is added)

### Product Catalog
- Klaviyo-compatible product feed for catalog syncing
- Multi-currency support
- Complete product details including inventory, pricing, and brand information
- Supports product variants with calculated prices

## Prerequisites

- Medusa server (v2.4.0 or higher)
- Klaviyo account with API credentials

## Installation

```bash
yarn add @eancarr/klaviyo-medusa
```

Or with npm:

```bash
npm install @eancarr/klaviyo-medusa
```

Then add the plugin to your `medusa-config.js` file:

```js
const plugins = [
  // ...
  {
    resolve: "@eancarr/klaviyo-medusa",
    options: {
      apiKey: process.env.KLAVIYO_API_KEY,
    },
  },
];
```

## Configuration

### Configuration Options

| Option   | Type     | Description          | Default     |
| -------- | -------- | -------------------- | ----------- |
| `apiKey` | `string` | Your Klaviyo API key | `undefined` |

### Environment Variables

```bash
KLAVIYO_API_KEY=your_klaviyo_api_key
STOREFRONT_URL=https://your-storefront-url.com  # Optional: Your actual storefront URL (where customers view products). Used for product feed links. Defaults to http://localhost:8000
```

## Usage

Once installed and configured, the plugin will automatically track the following events:

### Automatic Event Tracking

The plugin uses Medusa event subscribers to listen for events and send them to Klaviyo:

#### Customer Events
- `customer.created` - Syncs new customers to Klaviyo
- `customer.updated` - Updates customer profiles in Klaviyo

#### Order Events
- `order.placed` - Sends "Placed Order" event with order details
- `order.fulfillment_created` - Sends "Order Shipped" event with tracking info
- `order.canceled` - Sends "Order Canceled" event with refund details
- `order.completed` - Sends "Order Delivered" event

#### Return Events
- `order.return_requested` - Sends "Return Requested" event
- `order.return_received` - Sends "Return Received" event

#### Cart Events
- `cart.updated` - Tracks "Added to Cart" and "Started Checkout" events

All events are tracked server-side for reliability and include complete data from your Medusa database. These events can be used in Klaviyo to:
- Build automated email flows (abandoned cart, shipping notifications, etc.)
- Segment customers based on behavior
- Track customer lifetime value
- Create product recommendations

### Client-Side Integration

To properly manage marketing consent for Klaviyo in your storefront, you should set consent settings in the customer's metadata. This ensures compliance with privacy regulations by only subscribing customers who have explicitly given consent.

When collecting customer information (during registration, newsletter signup, or checkout), update the customer metadata with Klaviyo consent flags:

```ts
// Example implementation in your storefront
const updateCustomerConsent = async (
  customerId: string,
  consentSettings: {
    email?: boolean;
    sms?: boolean;
    transactional_sms?: boolean;
    consented_at?: string; // ISO date string (optional)
  }
) => {
  // Call your store API endpoint that updates customer metadata
  await fetch("/store/customers/me", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify({
      metadata: {
        klaviyo: consentSettings, // Can be object or JSON string
      },
    }),
  });
};

// Usage example
updateCustomerConsent("cus_123", {
  email: true,
  sms: false,
  transactional_sms: true,
});
```

The plugin checks for these consent settings when syncing customer data to Klaviyo:

- `metadata.klaviyo.email`: Set to `true` to opt the customer into email marketing
- `metadata.klaviyo.sms`: Set to `true` to opt the customer into SMS marketing
- `metadata.klaviyo.transactional_sms`: Set to `true` to opt the customer into transactional SMS
- `metadata.klaviyo.consented_at`: Optional ISO date string for consent timestamp

The `metadata.klaviyo` value can be either:
- A JSON object with the consent properties
- A JSON string that will be parsed automatically

### Product Feed

The plugin provides a Klaviyo-compatible product feed API that allows you to sync your entire product catalog with Klaviyo. This enables product recommendations, abandoned cart emails with product details, and more.

To use the product feed in Klaviyo:

1. Access your product feed at: `https://your-medusa-url.com/feeds/products/{currencyCode}`

   - Replace `{currencyCode}` with your store's currency code (e.g., `usd`, `eur`)

2. In your Klaviyo account:
   - Go to "Content" → "Products"
   - Click "Manage Custome Catalog Sources"
   - Click "Add new source"
   - Enter your product feed URL
   - Configure sync settings according to your needs

The product feed includes comprehensive product data:

- Product ID
- Title
- Description
- Handle/Slug
- SKU
- Thumbnail and Images
- **Brand** information
- Pricing information (min/max prices, compare-at-price)
- Currency
- Product URL
- Categories
- Inventory quantity and availability status
- Product variants with calculated prices

## Extending the Plugin

You can extend the plugin by:

1. Creating custom workflows in your Medusa server that utilize the Klaviyo service
2. Adding additional event subscribers to sync more data types
3. Enhancing the data structure sent to Klaviyo

Example of using the Klaviyo service in your own code:

```ts
// Access the Klaviyo service
const klaviyoService = container.resolve("klaviyoService");

// Create an event
await klaviyoService.createEvent({
  metric: {
    name: "Custom Event",
  },
  profile: {
    email: "customer@example.com",
  },
  properties: {
    // Your custom properties
  },
});

// Upsert a customer profile
await klaviyoService.upsertProfile({
  email: "customer@example.com",
  phone_number: "+1234567890",
  // ... other profile attributes
});

// Bulk subscribe profiles
await klaviyoService.bulkSubscribeProfiles([
  {
    type: "profile",
    id: "profile-id",
    attributes: {
      email: "customer@example.com",
      subscriptions: {
        email: {
          marketing: {
            consent: "SUBSCRIBED",
          },
        },
      },
    },
  },
]);
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/eancarr/klaviyo-medusa.git

# Install dependencies
cd klaviyo-medusa
yarn

# Start development server
yarn dev
```

## License

MIT
