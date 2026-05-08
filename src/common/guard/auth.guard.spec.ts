import { Test, TestingModule } from '@nestjs/testing';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from './auth.guard';

function makeContext(
  authHeader?: string,
  permissionsVal: Record<string, unknown> = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authHeader ? { authorization: authHeader } : {},
        permissionsVal,
      }),
    }),
    getHandler: () => jest.fn(),
    getClass: () => jest.fn(),
  } as unknown as ExecutionContext;
}

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let jwtService: { verifyAsync: jest.Mock };
  let reflector: { getAllAndOverride: jest.Mock };

  beforeEach(async () => {
    jwtService = { verifyAsync: jest.fn() };
    reflector = { getAllAndOverride: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        { provide: JwtService, useValue: jwtService },
        { provide: Reflector, useValue: reflector },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);
  });

  describe('@Public() bypass', () => {
    it('returns true without checking the token', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const result = await guard.canActivate(makeContext());
      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });
  });

  describe('token validation', () => {
    it('throws UnauthorizedException when Authorization header is absent', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      await expect(guard.canActivate(makeContext())).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('throws UnauthorizedException when token type is not Bearer', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      await expect(
        guard.canActivate(makeContext('Basic dXNlcjpwYXNz')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when token is expired / invalid', async () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      await expect(
        guard.canActivate(makeContext('Bearer bad.token.here')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('passes and sets request.user when token is valid', async () => {
      const payload = { sub: 1, username: 'bob', permissions: [] };
      reflector.getAllAndOverride
        .mockReturnValueOnce(false) // isPublic
        .mockReturnValueOnce(undefined); // requiredPermissions
      jwtService.verifyAsync.mockResolvedValue(payload);

      const req = {
        headers: { authorization: 'Bearer valid' },
        permissionsVal: {},
      };
      const ctx = {
        switchToHttp: () => ({ getRequest: () => req }),
        getHandler: () => jest.fn(),
        getClass: () => jest.fn(),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(ctx);
      expect(result).toBe(true);
      expect(req['user']).toEqual(payload);
    });
  });

  describe('RBAC permission checks', () => {
    const validPayload = {
      sub: 1,
      username: 'bob',
      permissions: ['user:read'],
    };

    beforeEach(() => {
      jwtService.verifyAsync.mockResolvedValue(validPayload);
      // first call → isPublic = false
      reflector.getAllAndOverride.mockReturnValueOnce(false);
    });

    it('passes when no permissions are required', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(undefined);
      const result = await guard.canActivate(makeContext('Bearer token'));
      expect(result).toBe(true);
    });

    it('passes when user holds the required permission', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(['user:read']);
      const result = await guard.canActivate(makeContext('Bearer token'));
      expect(result).toBe(true);
    });

    it('throws ForbiddenException when user lacks a required permission', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce(['user:delete']);
      await expect(
        guard.canActivate(makeContext('Bearer token')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws ForbiddenException when user has some but not all required permissions', async () => {
      reflector.getAllAndOverride.mockReturnValueOnce([
        'user:read',
        'user:delete',
      ]);
      await expect(
        guard.canActivate(makeContext('Bearer token')),
      ).rejects.toThrow(ForbiddenException);
    });

    it('wildcard * bypasses all permission checks', async () => {
      jwtService.verifyAsync.mockResolvedValue({
        sub: 1,
        username: 'admin',
        permissions: ['*'],
      });
      reflector.getAllAndOverride.mockReturnValueOnce([
        'any:sensitive:permission',
      ]);
      const result = await guard.canActivate(makeContext('Bearer admin-token'));
      expect(result).toBe(true);
    });
  });
});
