import chai from 'chai';
import chaiHttp from 'chai-http';
import app from '../app/app.js';

const { expect } = chai;
chai.use(chaiHttp);

describe('GET /api/brands', () => {
  it('returns a list of brands', async () => {
    const res = await chai.request(app).get('/api/brands');

    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });
});
