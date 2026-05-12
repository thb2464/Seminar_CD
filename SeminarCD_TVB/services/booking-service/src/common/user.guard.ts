import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class UserGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userId = request.header('x-user-id');
    if (!userId) {
      throw new UnauthorizedException('You must be logged in to book a tour.');
    }
    
    // Attach to request so decorator can read it
    (request as any).user = {
      id: parseInt(userId, 10),
      email: request.header('x-user-email'),
      role: request.header('x-user-role'),
    };
    
    return true;
  }
}
