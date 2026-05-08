import {
  ArgumentsHost,
  BadRequestException,
  ForbiddenException,
  HttpStatus,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function createMockHost(url = '/test') {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const request = { url };
  const host = {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(response),
      getRequest: jest.fn().mockReturnValue(request),
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
  });

  describe('response shape', () => {
    it('always includes success=false, statusCode, message, timestamp, path', () => {
      const { host, status, json } = createMockHost('/api/test');
      filter.catch(new NotFoundException(), host);

      expect(status).toHaveBeenCalledWith(404);
      const body = json.mock.calls[0][0];
      expect(body.success).toBe(false);
      expect(body.statusCode).toBe(404);
      expect(body.path).toBe('/api/test');
      expect(body.timestamp).toBeDefined();
      expect(new Date(body.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('HttpException handling', () => {
    it('maps NotFoundException → 404', () => {
      const { host, status } = createMockHost();
      filter.catch(new NotFoundException('item not found'), host);
      expect(status).toHaveBeenCalledWith(404);
    });

    it('maps ForbiddenException → 403 with message', () => {
      const { host, status, json } = createMockHost();
      filter.catch(new ForbiddenException('no access'), host);
      expect(status).toHaveBeenCalledWith(403);
      expect(json.mock.calls[0][0].message).toBe('no access');
    });

    it('maps UnauthorizedException → 401', () => {
      const { host, status } = createMockHost();
      filter.catch(new UnauthorizedException(), host);
      expect(status).toHaveBeenCalledWith(401);
    });

    it('flattens ValidationPipe BadRequestException with message array', () => {
      const { host, status, json } = createMockHost();
      const exception = new BadRequestException({
        message: ['name must be a string', 'email must be valid'],
        error: 'Bad Request',
        statusCode: 400,
      });

      filter.catch(exception, host);

      expect(status).toHaveBeenCalledWith(400);
      const body = json.mock.calls[0][0];
      expect(body.message).toBe('Validation failed');
      expect(body.errors).toEqual([
        'name must be a string',
        'email must be valid',
      ]);
    });
  });

  describe('Prisma error handling', () => {
    it('maps P2002 (unique constraint) → 409 with field name', () => {
      const { host, status, json } = createMockHost();
      const err = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint violation',
        { code: 'P2002', clientVersion: '6.0.0', meta: { target: ['email'] } },
      );

      filter.catch(err, host);

      expect(status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(json.mock.calls[0][0].message).toContain('email');
    });

    it('maps P2025 (record not found) → 404', () => {
      const { host, status } = createMockHost();
      const err = new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: '6.0.0',
      });

      filter.catch(err, host);
      expect(status).toHaveBeenCalledWith(404);
    });

    it('maps P2003 (foreign key constraint) → 400', () => {
      const { host, status } = createMockHost();
      const err = new Prisma.PrismaClientKnownRequestError(
        'Foreign key constraint',
        { code: 'P2003', clientVersion: '6.0.0' },
      );

      filter.catch(err, host);
      expect(status).toHaveBeenCalledWith(400);
    });

    it('maps PrismaClientValidationError → 400', () => {
      const { host, status } = createMockHost();
      const err = new Prisma.PrismaClientValidationError('Validation error', {
        clientVersion: '6.0.0',
      });

      filter.catch(err, host);
      expect(status).toHaveBeenCalledWith(400);
    });
  });

  describe('unknown error handling', () => {
    it('maps unknown Error → 500 with generic message', () => {
      const { host, status, json } = createMockHost();
      filter.catch(new Error('unexpected crash'), host);

      expect(status).toHaveBeenCalledWith(500);
      expect(json.mock.calls[0][0].message).toBe('Internal server error');
    });

    it('maps non-Error thrown value → 500', () => {
      const { host, status } = createMockHost();
      filter.catch('something bad', host);
      expect(status).toHaveBeenCalledWith(500);
    });
  });
});
