const chaiHttp = require('chai-http');
const chai = require('chai');
const app = require('../app/server.js');

const { expect } = chai;
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
          expect(res.body).to.have.property('user');
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
        .get('/api/brands/1/products')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an('array');
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

    it('should return cart for authenticated user', (done) => {
      chai.request(app)
        .post('/api/login')
        .send(validCredentials)
        .end((err, loginRes) => {
          const token = loginRes.body.token;
          
          chai.request(app)
            .get('/api/me/cart')
            .set('Authorization', `Bearer ${token}`)
            .end((err, res) => {
              expect(res).to.have.status(200);
              done();
            });
        });
    });
  });

  describe('POST /api/me/cart', () => {
    it('should require authentication', (done) => {
      chai.request(app)
        .post('/api/me/cart')
        .send({ productId: '1', quantity: 1 })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe('DELETE /api/me/cart/:productId', () => {
    it('should require authentication', (done) => {
      chai.request(app)
        .delete('/api/me/cart/1')
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });
  });

  describe('POST /api/me/cart/:productId', () => {
    it('should require authentication', (done) => {
      chai.request(app)
        .post('/api/me/cart/1')
        .send({ quantity: 5 })
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
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
  });
});
