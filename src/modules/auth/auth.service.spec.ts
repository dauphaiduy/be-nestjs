import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { RolesService } from '../roles/roles.service';
import { RegisterDto } from './dto/register.dto';

jest.mock('src/common/utils/hash.util', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

import { comparePassword } from 'src/common/utils/hash.util';

describe('AuthService', () => {
  let service: AuthService;
  let userService: { findOne: jest.Mock; create: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let rolesService: { findOne: jest.Mock };

  beforeEach(async () => {
    userService = { findOne: jest.fn(), create: jest.fn() };
    jwtService = { signAsync: jest.fn() };
    rolesService = { findOne: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: userService },
        { provide: JwtService, useValue: jwtService },
        { provide: RolesService, useValue: rolesService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('throws UnauthorizedException when user is not found', async () => {
      userService.findOne.mockResolvedValue(null);
      await expect(
        service.login({ username: 'bob', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when user has no password (OAuth account)', async () => {
      userService.findOne.mockResolvedValue({
        id: 1,
        username: 'bob',
        password: null,
        roleId: 1,
      });
      await expect(
        service.login({ username: 'bob', password: 'pass' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException on invalid password', async () => {
      userService.findOne.mockResolvedValue({
        id: 1,
        username: 'bob',
        password: 'hashed',
        roleId: 1,
      });
      (comparePassword as jest.Mock).mockResolvedValue(false);
      await expect(
        service.login({ username: 'bob', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('returns accessToken on valid credentials', async () => {
      userService.findOne.mockResolvedValue({
        id: 1,
        username: 'bob',
        password: 'hashed',
        roleId: 2,
      });
      (comparePassword as jest.Mock).mockResolvedValue(true);
      rolesService.findOne.mockResolvedValue({
        id: 2,
        permissions: ['user:read'],
      });
      jwtService.signAsync.mockResolvedValue('jwt-token');

      const result = await service.login({ username: 'bob', password: 'pass' });

      expect(result).toEqual({ accessToken: 'jwt-token' });
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        username: 'bob',
        sub: 1,
        permissions: ['user:read'],
      });
    });
  });

  describe('register', () => {
    it('throws when username already exists', async () => {
      userService.findOne.mockResolvedValue({ id: 1 });
      await expect(
        service.register({
          username: 'bob',
          email: 'b@b.com',
          password: 'pass',
          roleId: 1,
        } as RegisterDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws when email already exists', async () => {
      userService.findOne
        .mockResolvedValueOnce(null) // username check
        .mockResolvedValueOnce({ id: 2 }); // email check
      await expect(
        service.register({
          username: 'bob',
          email: 'b@b.com',
          password: 'pass',
          roleId: 1,
        } as RegisterDto),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates and returns the new user', async () => {
      userService.findOne.mockResolvedValue(null);
      userService.create.mockResolvedValue({ id: 1, username: 'bob' });

      const result = await service.register({
        username: 'bob',
        email: 'b@b.com',
        password: 'pass',
        roleId: 1,
      } as RegisterDto);

      expect(result).toEqual({ id: 1, username: 'bob' });
    });
  });

  describe('getPermissions', () => {
    it('returns empty array when roleId is null', async () => {
      const permissions = await service.getPermissions(null);
      expect(permissions).toEqual([]);
    });

    it('returns permissions from the role', async () => {
      rolesService.findOne.mockResolvedValue({
        id: 1,
        permissions: ['user:read', 'user:create'],
      });
      const permissions = await service.getPermissions(1);
      expect(permissions).toEqual(['user:read', 'user:create']);
    });

    it('returns empty array when role has no permissions', async () => {
      rolesService.findOne.mockResolvedValue({ id: 1, permissions: null });
      const permissions = await service.getPermissions(1);
      expect(permissions).toEqual([]);
    });
  });
});
