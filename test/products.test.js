const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app/app.js');

const { expect } = chai;
chai.use(chaiHttp);

describe('Products', () => {
  it('returns products', async () => {
    const res = await chai.request(app).get('/api/products');
    expect(res).to.have.status(200);
    expect(res.body).to.be.an('array');
  });
});
