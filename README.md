# Sunglasses E-Commerce API

A RESTful API for browsing and purchasing sunglasses, built with Express.js following Test-Driven Development (TDD) practices.

## Features

- 🕶️ Browse sunglasses by brand
- 🔍 Search and filter products
- 🛒 Shopping cart management
- 🔐 Token-based authentication
- 📚 Comprehensive API documentation with Swagger
- ✅ Full test coverage with Mocha and Chai

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Testing:** Mocha, Chai, chai-http
- **Documentation:** Swagger/OpenAPI 3.0
- **Data Storage:** JSON files (in-memory for demo)

## Installation

1. **Clone the repository:**
```bash
   git clone https://github.com/littlepuppi/sunglasses-io.git
   cd sunglasses-io
```

2. **Install dependencies:**
```bash
   npm install
```

## Running the Application

**Development server:**
```bash
npm run dev
```

The server will start on `http://localhost:3001`

**View API Documentation:**
Open your browser and navigate to:
```
http://localhost:3001/api-docs
```

## Testing

**Run all tests:**
```bash
npm test
```

**Test Results:**
- ✅ 19 tests passing
- 100% pass rate
- Comprehensive coverage of all endpoints and edge cases

## API Endpoints

### Public Endpoints (No Authentication Required)

#### Brands
- `GET /api/brands` - Get all sunglasses brands
- `GET /api/brands/:id/products` - Get all products for a specific brand

#### Products
- `GET /api/products` - Get all products

#### Authentication
- `POST /api/register` - Register a new user account
- `POST /api/login` - Login with username/email and password
  - Accepts any username/password combination (demo mode)
  - Returns authentication token

### Protected Endpoints (Authentication Required)

All cart endpoints require a valid Bearer token in the Authorization header.

#### Shopping Cart
- `GET /api/me/cart` - Get current user's cart
- `POST /api/me/cart` - Add product to cart
- `POST /api/me/cart/:productId` - Update product quantity
- `DELETE /api/me/cart/:productId` - Remove product from cart

## Authentication

This API uses Bearer token authentication for cart operations.

### Login Example:

### Register Example:
```bash
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username": "johndoe", "email": "john@example.com", "password": "mypassword"}'
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "token-johndoe-1234567890",
  "user": {
    "username": "johndoe",
    "email": "john@example.com"
  }
}
```

The registration automatically logs you in and returns a token.

```bash
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "user@example.com", "password": "password"}'
```

**Response:**
```json
{
  "token": "token-user@example.com-1234567890",
  "user": {
    "username": "user@example.com",
    "email": "user@example.com"
  }
}
```

### Using the Token:
Include the token in the Authorization header for protected endpoints:
```bash
curl -X GET http://localhost:3001/api/me/cart \
  -H "Authorization: Bearer token-user@example.com-1234567890"
```

## Project Structure
```
sunglasses-io/
├── app/
│   ├── server.js          # Main Express application
│   └── app.js             # Simplified app for testing
├── test/
│   ├── brands.test.js     # Brand endpoint tests
│   ├── products.test.js   # Product endpoint tests
│   ├── server.test.js     # Server and auth tests
│   └── test-complete.js   # Comprehensive integration tests
├── initial-data/
│   ├── brands.json        # Brand data
│   ├── products.json      # Product catalog
│   └── users.json         # User data
├── swagger.yaml           # OpenAPI/Swagger specification
├── package.json
└── README.md
```

## Development Approach

This project was built using **Test-Driven Development (TDD)**:

1. ✅ Write test first
2. ❌ Watch it fail
3. ✅ Implement feature to make it pass
4. ♻️ Refactor and repeat

All features were developed with tests written first, ensuring comprehensive coverage and reliable functionality.

## Error Handling

The API includes comprehensive error handling:

- **400 Bad Request** - Missing or invalid request data
- **401 Unauthorized** - Missing or invalid authentication
- **404 Not Found** - Resource not found
- **500 Internal Server Error** - Server-side errors

## Data Models

### Brand
```json
{
  "id": "1",
  "name": "Oakley"
}
```

### Product
```json
{
  "id": "1",
  "categoryId": "1",
  "name": "Superglasses",
  "description": "The best glasses in the world",
  "price": 150,
  "imageUrl": "/images/product1.jpg"
}
```

### Cart Item
```json
{
  "product": { /* Product object */ },
  "quantity": 2
}
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Write tests for your feature
4. Implement the feature
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

## License

This project is part of a coding evaluation.

## Author

Emily Lam ([@littlepuppi](https://github.com/littlepuppi))

## Acknowledgments

- Built as part of a technical evaluation
- Inspired by Uber, Petstore, and Goalworthy API examples
- Swagger documentation for API visualization
