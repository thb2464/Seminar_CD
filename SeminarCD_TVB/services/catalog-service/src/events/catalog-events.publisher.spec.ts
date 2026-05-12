import { ConfigService } from '@nestjs/config';

import { Tour } from '../catalog/entities/tour.entity';
import {
  TOUR_CREATED,
  TOUR_DELETED,
  TOUR_UPDATED,
  toTourPayload,
} from './catalog-event.types';
import { CatalogEventsPublisher } from './catalog-events.publisher';

function makeTour(): Tour {
  const tour = new Tour();
  Object.assign(tour, {
    id: 42,
    documentId: 'doc-42',
    locale: 'vi',
    slug: 'hue-tour',
    tourName: 'Hue Tour',
    region: 'MienTrung',
    isFeatured: true,
    highlights: [],
    gallery: [],
    updatedAt: new Date('2026-05-12T10:00:00Z'),
  });
  return tour;
}

function buildConfig(values: Record<string, string | undefined>): ConfigService {
  return {
    get: jest.fn((key: string, fallback?: unknown) => values[key] ?? fallback),
  } as unknown as ConfigService;
}

interface FakeChannel {
  publish: jest.Mock;
  close: jest.Mock;
}

function makeChannel(): FakeChannel {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

function makeConnection(channel: FakeChannel) {
  return {
    createChannel: jest.fn(() => channel as unknown),
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  };
}

describe('toTourPayload', () => {
  it('returns the projection used in the event envelope', () => {
    const payload = toTourPayload(makeTour());
    expect(payload).toEqual({
      id: 42,
      documentId: 'doc-42',
      locale: 'vi',
      slug: 'hue-tour',
      tourName: 'Hue Tour',
      region: 'MienTrung',
      isFeatured: true,
      updatedAt: '2026-05-12T10:00:00.000Z',
    });
  });
});

describe('CatalogEventsPublisher', () => {
  it('does nothing when RABBITMQ_URL is unset', () => {
    const connectFactory = jest.fn();
    const publisher = new CatalogEventsPublisher(buildConfig({}), { connect: connectFactory });
    publisher.onModuleInit();
    expect(connectFactory).not.toHaveBeenCalled();
  });

  it('publishes TourCreated with correct routing key and envelope', async () => {
    const channel = makeChannel();
    const connection = makeConnection(channel);
    const connect = jest.fn().mockReturnValue(connection);
    const publisher = new CatalogEventsPublisher(
      buildConfig({ RABBITMQ_URL: 'amqp://x', CATALOG_EVENTS_EXCHANGE: 'catalog.events' }),
      { connect },
    );
    publisher.onModuleInit();

    await publisher.publishTourCreated(makeTour());

    expect(channel.publish).toHaveBeenCalledWith(
      'catalog.events',
      TOUR_CREATED,
      expect.objectContaining({
        type: TOUR_CREATED,
        service: 'catalog-service',
        payload: expect.objectContaining({ id: 42, slug: 'hue-tour' }),
      }),
      expect.objectContaining({
        contentType: 'application/json',
        persistent: true,
        messageId: 'TourCreated:42:vi',
      }),
    );
  });

  it.each([
    ['publishTourUpdated', TOUR_UPDATED] as const,
    ['publishTourDeleted', TOUR_DELETED] as const,
  ])('publishes %s with the right type', async (methodName, expectedType) => {
    const channel = makeChannel();
    const connection = makeConnection(channel);
    const connect = jest.fn().mockReturnValue(connection);
    const publisher = new CatalogEventsPublisher(
      buildConfig({ RABBITMQ_URL: 'amqp://x' }),
      { connect },
    );
    publisher.onModuleInit();
    // @ts-expect-error dynamic call by name
    await publisher[methodName](makeTour());
    expect(channel.publish.mock.calls[0]?.[1]).toBe(expectedType);
  });

  it('drops events silently when the channel never connects', async () => {
    const publisher = new CatalogEventsPublisher(buildConfig({}), { connect: jest.fn() });
    publisher.onModuleInit();
    await expect(publisher.publishTourCreated(makeTour())).resolves.toBeUndefined();
  });

  it('logs but does not throw when publish rejects', async () => {
    const channel = makeChannel();
    channel.publish.mockRejectedValueOnce(new Error('broker down'));
    const connection = makeConnection(channel);
    const connect = jest.fn().mockReturnValue(connection);
    const publisher = new CatalogEventsPublisher(
      buildConfig({ RABBITMQ_URL: 'amqp://x' }),
      { connect },
    );
    publisher.onModuleInit();
    await expect(publisher.publishTourUpdated(makeTour())).resolves.toBeUndefined();
  });
});
