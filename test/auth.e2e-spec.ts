import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const request = require('supertest') as typeof import('supertest');
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/common/prisma';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
  compare: jest.fn(),
  hashSync: jest.fn().mockReturnValue('hashed-password'),
}));

import * as bcrypt from 'bcrypt';

// ─── Minimal PrismaService stub ───────────────────────────────────────────────
const mockPrisma = {
  $connect: jest.fn().mockResolvedValue(undefined),
  $disconnect: jest.fn().mockResolvedValue(undefined),
  user: {
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    deleteMany: jest.fn(),
  },
  role: {
    findFirst: jest.fn(),
    findMany: jest.fn().mockResolvedValue([]),
    findUnique: jest.fn(),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  auditLog: {
    findMany: jest.fn().mockResolvedValue([]),
    count: jest.fn().mockResolvedValue(0),
    create: jest.fn().mockResolvedValue({ id: 1 }),
  },
};

describe('Auth (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(mockPrisma)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        stopAtFirstError: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Restore default resolved values after clearAllMocks
    mockPrisma.auditLog.create.mockResolvedValue({ id: 1 });
    mockPrisma.user.findMany.mockResolvedValue([]);
    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.role.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.findMany.mockResolvedValue([]);
    mockPrisma.auditLog.count.mockResolvedValue(0);
  });

  // ─── POST /api/auth/login ────────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    it('returns 400 when body is missing required fields', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(400);
    });

    it('returns 401 when user is not found', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'ghost', password: 'pass' })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('returns 401 when password is incorrect', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        username: 'bob',
        password: 'hashed',
        roleId: 1,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'bob', password: 'wrong' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('returns 200 with accessToken on valid credentials', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        username: 'bob',
        password: 'hashed',
        roleId: 1,
      });
      mockPrisma.role.findUnique.mockResolvedValue({
        id: 1,
        name: 'user',
        permissions: ['user:read'],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'bob', password: 'correct' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
    });
  });

  // ─── POST /api/auth/register ─────────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('returns 400 when required fields are missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({ username: 'bob' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 401 when username already exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: 1 });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'taken',
          email: 'new@test.com',
          password: 'pass123',
          name: 'Test User',
          accountType: 'LOCAL',
          roleId: 1,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('returns 200 and creates user on valid input', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: 2,
        username: 'newuser',
        email: 'new@test.com',
        roleId: 1,
      });

      const response = await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@test.com',
          password: 'pass123',
          name: 'New User',
          accountType: 'LOCAL',
          roleId: 1,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('newuser');
    });
  });

  // ─── Protected route access ───────────────────────────────────────────────────
  describe('Protected routes', () => {
    it('returns 401 when no token is provided', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/summary')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(401);
    });

    it('returns 401 when token is malformed', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/dashboard/summary')
        .set('Authorization', 'Bearer not.a.valid.jwt')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('returns 403 when user lacks required permission', async () => {
      // Log in as a user with no permissions
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 99,
        username: 'limited',
        password: 'hashed',
        roleId: 2,
      });
      mockPrisma.role.findUnique.mockResolvedValue({
        id: 2,
        name: 'limited',
        permissions: [],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'limited', password: 'pass' });

      const token = loginRes.body.data?.accessToken;

      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.role.count.mockResolvedValue(0);
      mockPrisma.auditLog.count.mockResolvedValue(0);

      const response = await request(app.getHttpServer())
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.statusCode).toBe(403);
    });

    it('returns 200 when admin with wildcard * permission accesses any route', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: 1,
        username: 'admin',
        password: 'hashed',
        roleId: 1,
      });
      mockPrisma.role.findUnique.mockResolvedValue({
        id: 1,
        name: 'admin',
        permissions: ['*'],
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const loginRes = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'pass' });

      const token = loginRes.body.data?.accessToken;

      mockPrisma.user.count.mockResolvedValue(10).mockResolvedValue(8);
      mockPrisma.role.count.mockResolvedValue(3);
      mockPrisma.auditLog.count.mockResolvedValue(100);

      const response = await request(app.getHttpServer())
        .get('/api/dashboard/summary')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
