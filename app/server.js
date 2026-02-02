import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import cors from 'cors';
import app from '../app/server.js';

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
const users = [
  { id: "u1", email: "test@test.com", password: "password" }
];

/**
 * Brand data model
 */
const brands = [
  { id: "b1", name: "Ray-Ban" },
  { id: "b2", name: "Oakley" }
];

/**
 * Product data model
 */
const products = [
  { id: "p1", name: "Aviator", price: 150, brandId: "b1", imageUrl: "/images/aviator.jpg" },
  { id: "p2", name: "Wayfarer", price: 120, brandId: "b1", imageUrl: "/images/wayfarer.jpg" },
  { id: "p3", name: "Holbrook", price: 180, brandId: "b2", imageUrl: "/images/holbrook.jpg" }
];

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

  // Extract and validate token
  const token = authHeader.split(" ")[1];
  if (token !== "fake-jwt-token") {
    return res.status(401).json({ error: "Invalid token" });
  }

  // Attach user to request
  req.user = { id: "user-1", email: "test@test.com" };
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
  const brandProducts = products.filter(p => p.brandId === brandId);
  
  // Check if brand exists
  if (brandProducts.length === 0) {
    const brandExists = brands.find(b => b.id === brandId);
    if (!brandExists) {
      return res.status(404).json({ error: 'Brand not found' });
    }
  }
  
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
  
  // Validate input
  if (!loginEmail || !password) {
    return res.status(400).json({ error: 'Missing credentials' });
  }
  
  // Find and validate user
  const user = users.find(u => u.email === loginEmail && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  
  // Return authentication token
  res.status(200).json({ token: 'fake-jwt-token', userId: user.id });
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

export default app;