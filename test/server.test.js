import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app/server.js';

chai.use(chaiHttp);
const { expect } = chai;

describe('Server', () => {
  it('responds to health check', async () => {
    const res = await chai.request(app).get('/');
    expect(res).to.have.status(200);
  });
});

describe('Brands', () => {
  it('returns a list of brands', async () => {
    const res = await chai.request(app).get('/api/brands');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });
});

describe('Login', () => {
  it('fails when credentials are missing', async () => {
    const res = await chai.request(app).post('/api/login');
    expect(res).to.have.status(400);
  });
});

describe('Cart', () => {
  it('rejects unauthenticated access', async () => {
    const res = await chai.request(app).post('/api/me/cart');
    expect(res).to.have.status(401);
  });
});
