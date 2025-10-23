const express = require('express');
require('dotenv').config(); // Load environment variables from .env file
const app = express();
const PORT = 3000;

// Mock the product feed logic directly (simplified version)
app.get('/feeds/products/:currencyCode', (req, res) => {
  const currencyCode = req.params.currencyCode.toLowerCase();
  
  // Get the storefront URL from environment variable
  const baseUrl = process.env.STOREFRONT_URL || 'http://localhost:3000';

  // Mock product data
  const products = [
    {
      id: 'prod_123',
      title: 'Test Product 1',
      description: 'A test product for Klaviyo feed testing',
      handle: 'test-product-1',
      thumbnail: 'https://via.placeholder.com/300x300',
      images: [
        { url: 'https://via.placeholder.com/300x300' },
        { url: 'https://via.placeholder.com/400x400' }
      ],
      variants: [
        {
          id: 'var_123',
          sku: 'TEST-SKU-001',
          inventory_quantity: 10,
          calculated_price: {
            calculated_amount: 29.99
          }
        },
        {
          id: 'var_124', 
          sku: 'TEST-SKU-002',
          inventory_quantity: 5,
          calculated_price: {
            calculated_amount: 39.99
          }
        }
      ],
      categories: [
        { name: 'Electronics' },
        { name: 'Gadgets' }
      ],
      metadata: {
        brand: 'Test Brand'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'prod_456',
      title: 'Test Product 2',
      description: 'Another test product',
      handle: 'test-product-2',
      thumbnail: 'https://via.placeholder.com/300x300',
      images: [
        { url: 'https://via.placeholder.com/300x300' }
      ],
      variants: [
        {
          id: 'var_456',
          sku: 'TEST-SKU-003',
          inventory_quantity: 0,
          calculated_price: {
            calculated_amount: 49.99
          }
        }
      ],
      categories: [
        { name: 'Accessories' }
      ],
      metadata: {
        brand: 'Another Brand'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  // Transform products to Klaviyo format (same logic as your route)
  const productsWithCalculatedPrice = products.map((product) => {
    const minPrice = product.variants.reduce((acc, variant) => {
      return Math.min(acc, variant.calculated_price.calculated_amount);
    }, Infinity);
    
    const maxPrice = product.variants.reduce((acc, variant) => {
      return Math.max(acc, variant.calculated_price.calculated_amount);
    }, 0);

    // Calculate total inventory across all variants
    const totalInventory = product.variants.reduce((acc, variant) => {
      return acc + (variant.inventory_quantity || 0);
    }, 0);

    return {
      id: product.id,
      title: product.title,
      description: product.description,
      link: `${baseUrl}/products/${product.handle}`,
      image_link: product.images?.[0]?.url || product.thumbnail,
      handle: product.handle,
      sku: product.variants?.[0]?.sku || product.id,
      brand: product.metadata?.brand || "Unknown",
      condition: "new",
      availability: totalInventory > 0 ? "in stock" : "out of stock",
      inventory_quantity: totalInventory,
      price: Math.round(minPrice * 100), // Convert to cents
      compare_at_price: minPrice !== maxPrice ? Math.round(maxPrice * 100) : null,
      currency: currencyCode.toUpperCase(),
      images: product.images?.map(img => img.url) || [product.thumbnail].filter(Boolean),
      categories: product.categories.map((category) => category.name),
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  });

  res.json(productsWithCalculatedPrice);
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Klaviyo Product Feed Test Server',
    endpoints: {
      productFeed: '/feeds/products/{currencyCode}',
      health: '/health'
    }
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Klaviyo Product Feed Test Server',
    endpoints: {
      productFeed: '/feeds/products/{currencyCode}',
      health: '/health',
      examples: {
        usd: '/feeds/products/usd',
        eur: '/feeds/products/eur'
      }
    }
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Klaviyo Product Feed Test Server running on http://localhost:${PORT}`);
  console.log(`📦 Product feed (USD): http://localhost:${PORT}/feeds/products/usd`);
  console.log(`📦 Product feed (EUR): http://localhost:${PORT}/feeds/products/eur`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
  console.log(`\n🔗 Ready for ngrok! Use: ngrok http ${PORT}`);
});
