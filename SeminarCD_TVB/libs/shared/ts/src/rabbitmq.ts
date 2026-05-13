export interface EventEnvelope<TPayload> {
  event_id: string;
  event_type: string;
  occurred_at: string;
  trace_id: string;
  payload: TPayload;
}

export interface PublishChannel {
  assertExchange: (exchange: string, type: "topic", options: { durable: boolean }) => Promise<unknown>;
  publish: (
    exchange: string,
    routingKey: string,
    content: Uint8Array,
    options: { contentType: "application/json"; persistent: boolean; headers: Record<string, string> },
  ) => boolean;
}

export interface ConsumeMessage {
  content: Uint8Array;
}

export interface ConsumeChannel {
  assertExchange: (exchange: string, type: "topic", options: { durable: boolean }) => Promise<unknown>;
  assertQueue: (queue: string, options: { durable: boolean }) => Promise<{ queue: string }>;
  bindQueue: (queue: string, exchange: string, routingKey: string) => Promise<unknown>;
  consume: (
    queue: string,
    handler: (message: ConsumeMessage | null) => Promise<void>,
    options: { noAck: boolean },
  ) => Promise<unknown>;
  ack: (message: ConsumeMessage) => void;
  nack: (message: ConsumeMessage, allUpTo: boolean, requeue: boolean) => void;
}

export function createEventEnvelope<TPayload>(
  eventType: string,
  payload: TPayload,
  traceId: string,
  eventId: string = crypto.randomUUID(),
): EventEnvelope<TPayload> {
  return {
    event_id: eventId,
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    trace_id: traceId,
    payload,
  };
}

export async function publishJsonEvent<TPayload>(
  channel: PublishChannel,
  exchange: string,
  routingKey: string,
  event: EventEnvelope<TPayload>,
): Promise<boolean> {
  await channel.assertExchange(exchange, "topic", { durable: true });
  const content = new TextEncoder().encode(JSON.stringify(event));

  return channel.publish(exchange, routingKey, content, {
    contentType: "application/json",
    persistent: true,
    headers: {
      event_type: event.event_type,
      trace_id: event.trace_id,
    },
  });
}

export async function bindJsonConsumer<TPayload>(
  channel: ConsumeChannel,
  exchange: string,
  queue: string,
  routingKeys: string[],
  handler: (event: EventEnvelope<TPayload>) => Promise<void>,
): Promise<void> {
  await channel.assertExchange(exchange, "topic", { durable: true });
  const assertedQueue = await channel.assertQueue(queue, { durable: true });

  for (const routingKey of routingKeys) {
    await channel.bindQueue(assertedQueue.queue, exchange, routingKey);
  }

  await channel.consume(
    assertedQueue.queue,
    async (message) => {
      if (!message) {
        return;
      }

      try {
        const decoded = new TextDecoder().decode(message.content);
        await handler(JSON.parse(decoded) as EventEnvelope<TPayload>);
        channel.ack(message);
      } catch {
        channel.nack(message, false, false);
      }
    },
    { noAck: false },
  );
}
