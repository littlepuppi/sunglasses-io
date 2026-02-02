import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app/server.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('Products', () => {
  it('returns products', async () => {
    const res = await chai.request(app).get('/api/products');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });
});
