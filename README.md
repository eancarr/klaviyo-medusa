# Klaviyo Integration for Medusa

A Medusa plugin that integrates Klaviyo's email marketing and customer engagement platform with your Medusa store.

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

- Automatically sync customers to Klaviyo when created or updated
- Send order data to Klaviyo on order placement
- Klaviyo-compatible product feed for catalog syncing

## Prerequisites

- Medusa server (v2.4.0 or higher)
- Klaviyo account with API credentials

## Installation

```bash
yarn add @variablevic/klaviyo-medusa
```

Then add the plugin to your `medusa-config.js` file:

```js
const plugins = [
  // ...
  {
    resolve: "@variablevic/klaviyo-medusa",
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
```

## Usage

Once installed and configured, the plugin will automatically:

1. Sync customer data to Klaviyo when customers are created or updated
2. Send order data to Klaviyo when orders are placed

The plugin uses Medusa event subscribers to listen for relevant events and trigger synchronization workflows.

### Client-Side Integration

To properly manage marketing consent for Klaviyo in your storefront, you should set consent settings in the customer's metadata. This ensures compliance with privacy regulations by only subscribing customers who have explicitly given consent.

When collecting customer information (during registration, newsletter signup, or checkout), update the customer metadata with Klaviyo consent flags:

```ts
// Example implementation in your storefront
const updateCustomerConsent = async (
  customerId: string,
  consentSettings: {
    email_marketing: boolean;
    sms_marketing?: boolean;
    transactional_sms?: boolean;
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
        klaviyo: {
          consent: consentSettings,
        },
      },
    }),
  });
};

// Usage example
updateCustomerConsent("cus_123", {
  email_marketing: true,
  sms_marketing: false,
});
```

The plugin checks for these consent settings when syncing customer data to Klaviyo:

- `metadata.klaviyo.consent.email_marketing`: Set to `true` to opt the customer into email marketing
- `metadata.klaviyo.consent.sms_marketing`: Set to `true` to opt the customer into SMS marketing
- Any other consent fields specific to your implementation

### Product Feed

The plugin provides a Klaviyo-compatible product feed API that allows you to sync your entire product catalog with Klaviyo. This enables product recommendations, abandoned cart emails with product details, and more.

To use the product feed in Klaviyo:

1. Access your product feed at: `https://your-medusa-url.com/feeds/products/{currencyCode}`

   - Replace `{currencyCode}` with your store's currency code (e.g., `usd`, `eur`)

2. In your Klaviyo account:
   - Go to "Catalog" → "Products"
   - Select "Add a custom feed"
   - Enter your product feed URL
   - Configure sync settings according to your needs

The product feed includes essential product data:

- Product ID
- Title
- Description
- Handle/Slug
- Thumbnail and Images
- Pricing information
- Currency
- Product URL
- Categories

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
```

## Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/klaviyo-medusa.git

# Install dependencies
cd klaviyo-medusa
yarn

# Start development server
yarn dev
```

## License

MIT
