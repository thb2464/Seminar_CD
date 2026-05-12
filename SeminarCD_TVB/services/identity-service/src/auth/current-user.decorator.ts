import { ExecutionContext, createParamDecorator } from '@nestjs/common';

import type { User } from '../users/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    return ctx.switchToHttp().getRequest().user as User;
  },
);
