import chaiHttp from 'chai-http';
import chai from 'chai';
import app from '../app/server.js';

const { expect } =chai;
chai.use(chaiHttp);

describe('Sunglasses API Tests', () => {
  let authToken;
  const validCredentials = {
    username: 'test@test.com',
    password: 'password'
  };

  // ===========================
  // AUTHENTICATION TESTS
  // ===========================
  
  describe('POST /api/login', () => {
    it('should login with valid credentials', (done) => {
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token');
          expect(res.body).to.have.property('userId');
          authToken = res.body.token;
          done();
        });
    });

    it('should reject login with missing credentials', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({ username: 'test@test.com' })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should reject login with invalid credentials', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({ username: 'wrong@email.com', password: 'wrongpass' })
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should accept both email and username fields', (done) => {
      chai.request(app)
        .post('/api/login')
        .send({ email: 'test@test.com', password: 'password' })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token');
          done();
        });
    });
  });

  // ===========================
  // BRAND TESTS
  // ===========================
  
  describe('GET /api/brands', () => {
  it('should return all brands', async () => {
    const res = await chai.request(app).get('/api/brands');

    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
    expect(res.body.length).to.be.at.least(1);
    expect(res.body[0]).to.have.property('id');
    expect(res.body[0]).to.have.property('name');
  });
});

  describe('GET /api/brands/:brandId/products', () => {
    it('should return products for a valid brand', (done) => {
      chai.request(app)
        .get('/api/brands/b1/products')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.at.least(1);
          done();
        });
    });

    it('should return 404 for invalid brand', (done) => {
      chai.request(app)
        .get('/api/brands/invalid-id/products')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  // ===========================
  // PRODUCT TESTS
  // ===========================
  
  describe('GET /api/products', () => {
    it('should return all products', (done) => {
      chai.request(app)
        .get('/api/products')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
          expect(res.body.length).to.be.at.least(1);
          expect(res.body[0]).to.have.property('id');
          expect(res.body[0]).to.have.property('name');
          expect(res.body[0]).to.have.property('price');
          done();
        });
    });
  });

  describe('GET /api/products/:productId', () => {
    it('should return a single product', (done) => {
      chai.request(app)
        .get('/api/products/p1')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('object');
          expect(res.body).to.have.property('id', 'p1');
          expect(res.body).to.have.property('name');
          expect(res.body).to.have.property('price');
          done();
        });
    });

    it('should return 404 for invalid product', (done) => {
      chai.request(app)
        .get('/api/products/invalid-id')
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property('error');
          done();
        });
    });
  });

  // ===========================
  // CART TESTS
  // ===========================
  
  describe('GET /api/me/cart', () => {
    it('should require authentication', (done) => {
      chai.request(app)
        .get('/api/me/cart')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error');
          done();
        });
    });

    it('should return empty cart for authenticated user', (done) => {
      // First login
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          // Then get cart
          chai.request(app)
            .get('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an('array');
              done();
            });
        });
    });
  });

  describe('POST /api/me/cart', () => {
    it('should require authentication', (done) => {
      chai.request(app)
        .post('/api/me/cart')
        .send({ productId: 'p1', quantity: 1 })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should add product to cart', (done) => {
      // First login
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          // Then add to cart
          chai.request(app)
            .post('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'p1', quantity: 2 })
            .end((err, res) => {
              expect(res).to.have.status(201);
              expect(res.body).to.have.property('items');
              expect(res.body.items).to.be.an('array');
              expect(res.body.items.length).to.equal(1);
              expect(res.body.items[0].quantity).to.equal(2);
              done();
            });
        });
    });

    it('should reject invalid product ID', (done) => {
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          chai.request(app)
            .post('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'invalid-id', quantity: 1 })
            .end((err, res) => {
              expect(res).to.have.status(404);
              expect(res.body).to.have.property('error');
              done();
            });
        });
    });

    it('should reject invalid quantity', (done) => {
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          chai.request(app)
            .post('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'p1', quantity: 0 })
            .end((err, res) => {
              expect(res).to.have.status(400);
              expect(res.body).to.have.property('error');
              done();
            });
        });
    });
  });

  describe('PATCH /api/me/cart/:productId', () => {
    it('should update product quantity', (done) => {
      // Login and add product first
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          // Add product
          chai.request(app)
            .post('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'p1', quantity: 2 })
            .end((err, addRes) => {
              
              // Update quantity
              chai.request(app)
                .patch('/api/me/cart/p1')
                .set('Authorization', `Bearer ${token}`)
                .send({ quantity: 5 })
                .end((err, res) => {
                  expect(res).to.have.status(200);
                  expect(res.body).to.have.property('quantity', 5);
                  done();
                });
            });
        });
    });

    it('should require authentication', (done) => {
      chai.request(app)
        .patch('/api/me/cart/p1')
        .send({ quantity: 5 })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should return 404 for product not in cart', (done) => {
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          chai.request(app)
            .patch('/api/me/cart/p999')
            .set('Authorization', `Bearer ${token}`)
            .send({ quantity: 5 })
            .end((err, res) => {
              expect(res).to.have.status(404);
              done();
            });
        });
    });
  });

  describe('DELETE /api/me/cart/:productId', () => {
    it('should remove product from cart', (done) => {
      // Login and add product first
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          // Add product
          chai.request(app)
            .post('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .send({ productId: 'p2', quantity: 1 })
            .end((err, addRes) => {
              
              // Delete product
              chai.request(app)
                .delete('/api/me/cart/p2')
                .set('Authorization', `Bearer ${token}`)
                .end((err, res) => {
                  expect(res).to.have.status(204);
                  done();
                });
            });
        });
    });

    it('should require authentication', (done) => {
      chai.request(app)
        .delete('/api/me/cart/p1')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should return 404 for product not in cart', (done) => {
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          chai.request(app)
            .delete('/api/me/cart/p999')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              expect(res).to.have.status(404);
              done();
            });
        });
    });
  });

  // ===========================
  // EDGE CASE TESTS
  // ===========================
  
  describe('Edge Cases', () => {
    it('should handle missing Authorization header', (done) => {
      chai.request(app)
        .get('/api/me/cart')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should handle malformed Authorization header', (done) => {
      chai.request(app)
        .get('/api/me/cart')
        .set('Authorization', 'InvalidFormat')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should handle invalid token', (done) => {
      chai.request(app)
        .get('/api/me/cart')
        .set('Authorization', 'Bearer invalid-token')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it('should return 404 for undefined routes', (done) => {
      chai.request(app)
        .get('/api/nonexistent')
        .end((err, res) => {
          expect(res).to.have.status(404);
          done();
        });
    });
  });
});