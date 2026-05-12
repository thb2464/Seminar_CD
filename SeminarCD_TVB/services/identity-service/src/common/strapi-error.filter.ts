import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * Wraps every HttpException into the Strapi `{ error: { status, message, name } }`
 * envelope so AuthContext.jsx and any other downstream consumers don't notice
 * the cut-over from Strapi's users-permissions plugin to this service.
 */
@Catch()
export class StrapiErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = this.extractMessage(exception, status);
    const name =
      exception instanceof HttpException
        ? exception.name
        : 'InternalServerError';

    response.status(status).json({
      error: {
        status,
        name,
        message,
      },
    });
  }

  private extractMessage(exception: unknown, status: number): string {
    if (exception instanceof HttpException) {
      const responseBody = exception.getResponse();
      if (typeof responseBody === 'string') {
        return responseBody;
      }
      if (responseBody && typeof responseBody === 'object') {
        const msg = (responseBody as { message?: unknown }).message;
        if (Array.isArray(msg)) {
          return msg.filter((m) => typeof m === 'string').join('; ') || exception.message;
        }
        if (typeof msg === 'string') {
          return msg;
        }
      }
      return exception.message;
    }
    return status === HttpStatus.INTERNAL_SERVER_ERROR
      ? 'Internal server error.'
      : 'Unexpected error.';
  }
}
