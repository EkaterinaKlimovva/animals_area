jest.mock('../src/utils/seed', () => ({
  seedDefaultAccounts: jest.fn().mockResolvedValue(undefined),
}));

import request from 'supertest';
import { Role } from '@prisma/client';
import app from '../src/app/app';
import { AccountService } from '../src/services/accountService';

describe('POST /registration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns 201 and response body for valid payload', async () => {
    jest.spyOn(AccountService.prototype, 'register').mockResolvedValue({
      account: {
        id: 1,
        firstName: 'Ivan',
        lastName: 'Ivanov',
        email: 'ivan@test.com',
        password: 'hashed-password',
        role: Role.USER,
      },
      token: 'mock-token',
    });

    const response = await request(app)
      .post('/registration')
      .send({
        firstName: 'Ivan',
        lastName: 'Ivanov',
        email: 'ivan@test.com',
        password: 'secret123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({
      id: 1,
      firstName: 'Ivan',
      lastName: 'Ivanov',
      email: 'ivan@test.com',
      role: 'USER',
    });
  });

  it('returns 400 for invalid payload', async () => {
    const response = await request(app)
      .post('/registration')
      .send({
        firstName: '',
        lastName: 'Ivanov',
        email: 'bad-email',
        password: '1',
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBeDefined();
  });
});