import express from 'express';
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs';
import { readFileSync } from 'fs';

const app = express();
const PORT = 3000;

// Load JSON data
const users = JSON.parse(readFileSync('./initial-data/users.json', 'utf-8'));
const brands = JSON.parse(readFileSync('./initial-data/brands.json', 'utf-8'));
const products = JSON.parse(readFileSync('./initial-data/products.json', 'utf-8'));

// Load Swagger
const swaggerDocument = YAML.load('./swagger.yaml');

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Auth Middleware
function requireAuth(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  next();
}

// PUBLIC ROUTES
app.get('/api/brands', (req, res) => {
  res.json(brands);
});

app.get('/api/brands/:id/products', (req, res) => {
  res.json([]);
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

app.post('/api/login', (req, res) => {
  res.status(401).json({ error: 'Invalid credentials' });
});

// CART ROUTES (AUTH REQUIRED)
app.get('/api/me/cart', requireAuth, (req, res) => {
  res.json([]);
});

app.post('/api/me/cart', requireAuth, (req, res) => {
  res.status(201).json({ message: 'Item added' });
});

app.delete('/api/me/cart/:productId', requireAuth, (req, res) => {
  res.status(204).send();
});

app.post('/api/me/cart/:productId', requireAuth, (req, res) => {
  res.json({ message: 'Quantity updated' });
});

// Error handler (keep this LAST)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something broke!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;