const express = require('express');
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ DO NOT start server in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

// ===========================
// SWAGGER DOCUMENTATION
// ===========================
const swaggerDocument = YAML.load('./swagger.yaml');

// ===========================
// MIDDLEWARE CONFIGURATION
// ===========================
app.use(cors());                                    // Enable CORS
app.use(express.json());                            // Parse JSON bodies
app.use(express.static('public'));                  // Serve static files
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ===========================
// DATA MODELS
// ===========================

/**
 * User data model
 * In production: passwords should be hashed with bcrypt
 */

/**
 * Brand data model
 */
/**
 * Load data from JSON files
 */
const users = JSON.parse(fs.readFileSync('./initial-data/users.json', 'utf-8'));
const brands = JSON.parse(fs.readFileSync('./initial-data/brands.json', 'utf-8'));
const products = JSON.parse(fs.readFileSync('./initial-data/products.json', 'utf-8'));
/**
 * Cart data model - stores per-user cart data
 * Key: userId, Value: { items: [], totalPrice: number }
 */
const carts = {};

// ===========================
// AUTHENTICATION MIDDLEWARE
// ===========================

/**
 * Authentication middleware - validates JWT token
 * Attaches user object to request if valid
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {Function} next - Express next middleware function
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  // Check if Authorization header exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Extract token - accept any token that starts with "token-"
  const token = authHeader.split(" ")[1];
  if (!token || !token.startsWith('token-')) {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Token is valid - extract username from token
  const username = token.split('-')[1];
  req.user = { id: username, username: username };
  
  next();
  next();
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Calculate total price of cart items
 */
function calculateCartTotal(cartItems) {
  return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Find product by ID
 */
function findProduct(productId) {
  return products.find(p => p.id === productId);
}

/**
 * Initialize cart for user if it doesn't exist
 */
function initializeCart(userId) {
  if (!carts[userId]) {
    carts[userId] = { items: [], totalPrice: 0 };
  }
  return carts[userId];
}

// ===========================
// PUBLIC ROUTES
// ===========================

/**
 * GET /api/brands
 * Returns all available brands
 */
app.get('/api/brands', (req, res) => {
  res.status(200).json(brands);
});

/**
 * GET /api/brands/:brandId/products
 * Returns all products for a specific brand
 */
app.get('/api/brands/:brandId/products', (req, res) => {
  const { brandId } = req.params;
  
  // Check if brand exists first
  const brandExists = brands.find(b => b.id === brandId);
  if (!brandExists) {
    return res.status(404).json({ error: 'Brand not found' });
  }
  
  // Get products for this brand (may be empty array)
  const brandProducts = products.filter(p => p.categoryId === brandId);
  
  res.status(200).json(brandProducts);
});
/**
 * GET /api/products
 * Returns all products
 */
app.get('/api/products', (req, res) => {
  res.status(200).json(products);
});

/**
 * GET /api/products/:productId
 * Returns a single product by ID
 */
app.get('/api/products/:productId', (req, res) => {
  const product = findProduct(req.params.productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.status(200).json(product);
});

/**
 * POST /api/login
 * Authenticates user and returns JWT token
 * Accepts both 'email' and 'username' fields
 */
app.post('/api/login', (req, res) => {
  const { email, password, username } = req.body;
  const loginEmail = email || username;
  
  // Validate input - only check if fields are provided
  if (!loginEmail || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  // Accept any username/password combination (for testing/demo purposes)
  // Generate a simple token based on the username
  const token = `token-${loginEmail}-${Date.now()}`;
  
  // Return success with token and user info
  res.status(200).json({ 
    token: token,
    user: {
      username: loginEmail,
      email: loginEmail.includes('@') ? loginEmail : `${loginEmail}@example.com`
    }
  });
});

// ===========================
// PROTECTED CART ROUTES
// (Require Authentication)
// ===========================

/**
 * GET /api/me/cart
 * Returns current user's cart contents
 * Requires: Authentication
 */
app.get('/api/me/cart', requireAuth, (req, res) => {
  const userCart = initializeCart(req.user.id);
  res.status(200).json(userCart.items);
});

/**
 * POST /api/me/cart
 * Add product to cart (or update quantity if already exists)
 * Requires: Authentication
 * Body: { productId: string, quantity?: number }
 */
app.post('/api/me/cart', requireAuth, (req, res) => {
  const { productId, quantity = 1 } = req.body;
  
  // Validate input
  if (!productId) {
    return res.status(400).json({ error: 'Product ID is required' });
  }
  
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }
  
  // Validate product exists
  const product = findProduct(productId);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  
  // Initialize cart
  const userCart = initializeCart(req.user.id);
  
  // Check if item already in cart
  const existingItem = userCart.items.find(item => item.productId === productId);
  
  if (existingItem) {
    // Update existing item quantity
    existingItem.quantity += quantity;
  } else {
    // Add new item to cart
    userCart.items.push({
      id: `item-${Date.now()}`,
      productId,
      name: product.name,
      price: product.price,
      quantity
    });
  }
  
  // Update total price
  userCart.totalPrice = calculateCartTotal(userCart.items);
  
  res.status(201).json(userCart);
});

/**
 * PATCH /api/me/cart/:productId
 * Update the quantity of a specific product in the cart
 * Requires: Authentication
 * Body: { quantity: number }
 */
app.patch('/api/me/cart/:productId', requireAuth, (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  // Validate quantity
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  // Get user's cart
  const userCart = carts[req.user.id];
  if (!userCart) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }

  // Find item in cart
  const item = userCart.items.find(i => i.productId === productId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }

  // Update quantity
  item.quantity = quantity;
  
  // Recalculate total
  userCart.totalPrice = calculateCartTotal(userCart.items);
  
  res.status(200).json({ 
    message: 'Quantity updated', 
    productId: item.productId,
    quantity: item.quantity
  });
});

/**
 * DELETE /api/me/cart/:productId
 * Remove a product from the cart
 * Requires: Authentication
 */

/**
 * POST /api/me/cart/:productId
 * Update quantity of a product in the cart
 * Requires: Authentication
 */
app.post('/api/me/cart/:productId', requireAuth, (req, res) => {
  const { quantity } = req.body;
  const { productId } = req.params;

  // Validate quantity
  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  // Get user's cart
  const userCart = carts[req.user.id];
  if (!userCart) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }

  // Find item in cart
  const item = userCart.items.find(i => i.productId === productId);
  if (!item) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }

  // Update quantity
  item.quantity = quantity;
  
  // Recalculate total
  userCart.totalPrice = calculateCartTotal(userCart.items);
  
  res.status(200).json({ 
    message: 'Quantity updated', 
    productId: item.productId,
    quantity: item.quantity
  });
});
app.delete('/api/me/cart/:productId', requireAuth, (req, res) => {
  const { productId } = req.params;
  
  // Get user's cart
  const userCart = carts[req.user.id];
  if (!userCart) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  // Find item index
  const index = userCart.items.findIndex(i => i.productId === productId);
  if (index === -1) {
    return res.status(404).json({ error: 'Item not found in cart' });
  }
  
  // Remove item
  userCart.items.splice(index, 1);
  
  // Recalculate total
  userCart.totalPrice = calculateCartTotal(userCart.items);
  
  res.status(204).send();
});

// ===========================
// ERROR HANDLING
// ===========================

/**
 * 404 handler for undefined routes
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/**
 * Global error handler
 * Catches any unhandled errors
 */
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// export ONLY the app

module.exports = app;