const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app/server.js');

const { expect } = chai;
chai.use(chaiHttp);

describe('POST /api/register', () => {
  it('should register a new user with username and password', async () => {
    const res = await chai.request(app)
      .post('/api/register')
      .send({
        username: 'newuser',
        password: 'password123'
      });

    expect(res).to.have.status(201);
    expect(res.body).to.have.property('message');
    expect(res.body).to.have.property('token');
    expect(res.body).to.have.property('user');
    expect(res.body.user).to.have.property('username', 'newuser');
  });

  it('should register a user with email and password', async () => {
    const res = await chai.request(app)
      .post('/api/register')
      .send({
        username: 'emailuser',
        email: 'test@example.com',
        password: 'password123'
      });

    expect(res).to.have.status(201);
    expect(res.body.user.email).to.equal('test@example.com');
  });

  it('should reject registration with missing username', async () => {
    const res = await chai.request(app)
      .post('/api/register')
      .send({
        password: 'password123'
      });

    expect(res).to.have.status(400);
    expect(res.body).to.have.property('error');
  });

  it('should reject registration with missing password', async () => {
    const res = await chai.request(app)
      .post('/api/register')
      .send({
        username: 'testuser'
      });

    expect(res).to.have.status(400);
    expect(res.body).to.have.property('error');
  });
});
