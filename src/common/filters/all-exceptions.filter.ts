import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { statusCode, message, errors } = this.resolve(exception);

    if (statusCode >= 500) {
      this.logger.error(exception);
    }

    const body: ErrorResponse = {
      success: false,
      statusCode,
      message,
      ...(errors && { errors }),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(statusCode).json(body);
  }

  private resolve(exception: unknown): {
    statusCode: number;
    message: string;
    errors?: string[];
  } {
    // HttpException (includes UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException, etc.)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const res = exception.getResponse();

      // ValidationPipe throws BadRequestException with { message: string[], error, statusCode }
      if (
        typeof res === 'object' &&
        res !== null &&
        'message' in res &&
        Array.isArray((res as Record<string, unknown>).message)
      ) {
        const messages = (res as Record<string, unknown>).message as string[];
        return {
          statusCode,
          message: 'Validation failed',
          errors: messages,
        };
      }

      const message =
        typeof res === 'string'
          ? res
          : typeof res === 'object' && 'message' in res
            ? String((res as Record<string, unknown>).message)
            : exception.message;

      return { statusCode, message };
    }

    // Prisma known request errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      return this.resolvePrismaError(exception);
    }

    // Prisma validation errors (schema mismatches)
    if (exception instanceof Prisma.PrismaClientValidationError) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid query parameters',
      };
    }

    // Fallback — unexpected errors
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
    };
  }

  private resolvePrismaError(err: Prisma.PrismaClientKnownRequestError): {
    statusCode: number;
    message: string;
  } {
    switch (err.code) {
      case 'P2002': {
        const fields = Array.isArray(err.meta?.['target'])
          ? (err.meta['target'] as string[]).join(', ')
          : 'field';
        return {
          statusCode: HttpStatus.CONFLICT,
          message: `A record with this ${fields} already exists`,
        };
      }
      case 'P2025':
        return {
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Record not found',
        };
      case 'P2003':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Referenced record does not exist',
        };
      case 'P2014':
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: 'Relation violation: required relation is missing',
        };
      default:
        return {
          statusCode: HttpStatus.BAD_REQUEST,
          message: `Database error (${err.code})`,
        };
    }
  }
}
