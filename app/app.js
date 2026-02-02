const express = require("express");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

/* -------------------------
   In-memory data stores
-------------------------- */

const users = [
  { id: "u1", email: "test@test.com", password: "password" }
];

const brands = [
  { id: "b1", name: "Ray-Ban" },
  { id: "b2", name: "Oakley" }
];

const products = [
  { id: "p1", name: "Aviator", price: 150, brandId: "b1" },
  { id: "p2", name: "Wayfarer", price: 120, brandId: "b1" },
  { id: "p3", name: "Holbrook", price: 180, brandId: "b2" }
];

let cart = {
  items: [],
  totalPrice: 0
};

/* -------------------------
   Auth middleware
-------------------------- */

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // fake user for now
  req.user = { id: "user123" };
  next();
}

/* -------------------------
   Routes
-------------------------- */

app.get("/", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/api/brands", (req, res) => {
  res.status(200).json(brands);
});

app.get("/api/products", (req, res) => {
  res.status(200).json(products);
});

app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Missing credentials" });
  }

  const user = users.find((u) => u.email === email && u.password === password);

  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }

  // Return a fake token (in production you'd use JWT)
  res.status(200).json({
    token: "faketoken_" + user.id,
    user: { id: user.id, email: user.email }
  });
});

app.get("/api/me/cart", authenticate, (req, res) => {
  res.status(200).json(cart);
});

/* -------------------------
   POST /api/me/cart
   Add item to cart
-------------------------- */
app.post("/api/me/cart", authenticate, (req, res) => {
  const { productId, quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const product = products.find((p) => p.id === productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }

  let item = cart.items.find((i) => i.productId === productId);

  if (item) {
    item.quantity += quantity;
  } else {
    item = {
      id: "ci" + Date.now(),
      productId,
      name: product.name,
      price: product.price,
      quantity
    };
    cart.items.push(item);
  }

  cart.totalPrice = cart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  res.status(201).json(cart);
});

/* -------------------------
   PATCH /api/me/cart/:productId
   Update quantity
-------------------------- */
app.patch("/api/me/cart/:productId", authenticate, (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ error: "Invalid quantity" });
  }

  const item = cart.items.find((i) => i.productId === productId);

  if (!item) {
    return res.status(404).json({ error: "Product not found in cart" });
  }

  item.quantity = quantity;

  cart.totalPrice = cart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  res.status(200).json({
    productId: item.productId,
    quantity: item.quantity
  });
});

/* -------------------------
   DELETE /api/me/cart/:productId
-------------------------- */
app.delete("/api/me/cart/:productId", authenticate, (req, res) => {
  const { productId } = req.params;

  const index = cart.items.findIndex((i) => i.productId === productId);

  if (index === -1) {
    return res.status(404).json({ error: "Product not found in cart" });
  }

  cart.items.splice(index, 1);

  cart.totalPrice = cart.items.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  res.status(204).send();
}); // <-- This closing brace was missing!

/* -------------------------
   Server
-------------------------- */

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});