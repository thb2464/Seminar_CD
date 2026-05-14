import { MetricsService } from './metrics.module';

describe('MetricsService', () => {
  it('renders HTTP and event metrics', async () => {
    const metrics = new MetricsService();

    metrics.recordHttpRequest('POST', '/api/bookings', 201, 0.01);
    metrics.recordEventPublish(
      'booking.events',
      'BookingCreated',
      'success',
      0.02,
    );

    const output = await metrics.render();
    expect(metrics.contentType).toContain('text/plain');
    expect(output).toContain('http_requests_total');
    expect(output).toContain('domain_events_published_total');
    expect(output).toContain('booking-service');
  });
});
