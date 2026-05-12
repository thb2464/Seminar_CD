import {
  ArgumentsHost,
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';

import { StrapiErrorFilter } from './strapi-error.filter';

function buildHost() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const response = { status };
  const host = {
    switchToHttp: () => ({
      getResponse: () => response,
    }),
  } as unknown as ArgumentsHost;
  return { host, status, json };
}

describe('StrapiErrorFilter', () => {
  const filter = new StrapiErrorFilter();

  it('wraps UnauthorizedException as Strapi envelope', () => {
    const { host, status, json } = buildHost();
    filter.catch(new UnauthorizedException('Invalid identifier or password.'), host);

    expect(status).toHaveBeenCalledWith(401);
    expect(json).toHaveBeenCalledWith({
      error: {
        status: 401,
        name: 'UnauthorizedException',
        message: 'Invalid identifier or password.',
      },
    });
  });

  it('joins ValidationPipe message arrays', () => {
    const { host, json } = buildHost();
    filter.catch(new BadRequestException(['username must be longer', 'email is invalid']), host);
    expect(json.mock.calls[0]?.[0].error.message).toBe(
      'username must be longer; email is invalid',
    );
  });

  it('handles ConflictException with object body', () => {
    const { host, json } = buildHost();
    filter.catch(new ConflictException('A user with this email already exists.'), host);
    expect(json.mock.calls[0]?.[0].error.status).toBe(409);
  });

  it('treats unknown errors as 500 with generic message', () => {
    const { host, status, json } = buildHost();
    filter.catch(new Error('boom'), host);
    expect(status).toHaveBeenCalledWith(500);
    expect(json.mock.calls[0]?.[0].error).toEqual({
      status: 500,
      name: 'InternalServerError',
      message: 'Internal server error.',
    });
  });
});
