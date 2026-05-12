import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';

import { AdminOnlyGuard } from './admin-only.guard';

function buildContext(headers: Record<string, string | undefined>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        header: (name: string) => headers[name.toLowerCase()],
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('AdminOnlyGuard', () => {
  const guard = new AdminOnlyGuard();

  it('rejects requests without X-User-Id', () => {
    expect(() => guard.canActivate(buildContext({}))).toThrow(UnauthorizedException);
  });

  it('rejects non-admin roles', () => {
    expect(() =>
      guard.canActivate(buildContext({ 'x-user-id': '1', 'x-user-role': 'authenticated' })),
    ).toThrow(ForbiddenException);
  });

  it('admits admin role', () => {
    expect(
      guard.canActivate(buildContext({ 'x-user-id': '1', 'x-user-role': 'admin' })),
    ).toBe(true);
  });
});
