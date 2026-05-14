describe('prometheus metrics middleware', () => {
  it('serves the registry on /metrics without calling downstream middleware', async () => {
    jest.resetModules();
    const middleware = require('../src/middlewares/prometheus-metrics')();
    const ctx = {
      path: '/metrics',
      set: jest.fn(),
    };
    const next = jest.fn();

    await middleware(ctx, next);

    expect(next).not.toHaveBeenCalled();
    expect(ctx.set).toHaveBeenCalledWith('Content-Type', expect.stringContaining('text/plain'));
    expect(ctx.body).toContain('nodejs_process_cpu_user_seconds_total');
  });

  it('records HTTP request metrics after downstream middleware runs', async () => {
    jest.resetModules();
    const factory = require('../src/middlewares/prometheus-metrics');
    const middleware = factory();
    const ctx = {
      path: '/api/faq',
      method: 'GET',
      status: 200,
      _matchedRoute: '/api/faq',
    };

    await middleware(ctx, jest.fn().mockResolvedValue(undefined));

    const output = await factory.registry.metrics();
    expect(output).toContain('http_requests_total');
    expect(output).toContain('content-service');
    expect(output).toContain('/api/faq');
  });
});
