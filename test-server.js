const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Mock Medusa request/response objects
const createMockRequest = (currencyCode) => ({
  params: { currencyCode },
  get: (header) => {
    if (header === 'x-forwarded-proto') return 'https';
    if (header === 'x-forwarded-host') return 'localhost:3000';
    if (header === 'host') return 'localhost:3000';
    return null;
  },
  protocol: 'https',
  scope: {
    resolve: (key) => {
      if (key === 'ContainerRegistrationKeys.QUERY') {
        return {
          graph: async ({ entity, fields, context }) => {
            // Mock product data for testing
            return {
              data: [
                {
                  id: 'prod_123',
                  title: 'Test Product',
                  description: 'A test product for Klaviyo feed',
                  handle: 'test-product',
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
                }
              ]
            };
          }
        };
      }
      return null;
    }
  }
});

const createMockResponse = () => {
  const res = {
    json: (data) => {
      res._data = data;
      return res;
    }
  };
  return res;
};

// Import and use your actual route handler
const { GET } = require('./src/api/feeds/products/[currencyCode]/route.ts');

// Route handler
app.get('/feeds/products/:currencyCode', async (req, res) => {
  try {
    const mockReq = createMockRequest(req.params.currencyCode);
    const mockRes = createMockResponse();
    
    await GET(mockReq, mockRes);
    
    res.json(mockRes._data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Test server running on http://localhost:${PORT}`);
  console.log(`📦 Product feed: http://localhost:${PORT}/feeds/products/usd`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});
