import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * Trusts the `X-User-Role` header set by Kong's `post-function` plugin after JWT
 * validation (see services/api-gateway/kong.yml). Downstream services do not
 * re-validate the raw JWT — the header is the contract.
 */
@Injectable()
export class AdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.header('x-user-id');
    if (!userId) {
      throw new UnauthorizedException('Missing X-User-Id header (JWT required).');
    }
    const role = request.header('x-user-role');
    if (role !== 'admin') {
      throw new ForbiddenException('Admin role required.');
    }
    return true;
  }
}
