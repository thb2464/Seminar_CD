import { bindJsonConsumer, createEventEnvelope, publishJsonEvent, type ConsumeMessage } from "./rabbitmq.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const event = createEventEnvelope("TourUpdated", { id: 1 }, "trace-1", "event-1");
assert(event.event_id === "event-1", "event id should be configurable");
assert(event.event_type === "TourUpdated", "event type should be retained");

const published: { exchange: string; routingKey: string; content: Uint8Array }[] = [];
const publishResult = await publishJsonEvent(
  {
    assertExchange: async () => undefined,
    publish: (exchange, routingKey, content) => {
      published.push({ exchange, routingKey, content });
      return true;
    },
  },
  "catalog.events",
  "TourUpdated",
  event,
);

assert(publishResult, "publish helper should return channel publish result");
assert(published[0]?.exchange === "catalog.events", "publish helper should use exchange");
assert(published[0]?.routingKey === "TourUpdated", "publish helper should use routing key");

const decoded = JSON.parse(new TextDecoder().decode(published[0]?.content)) as Record<string, unknown>;
assert(decoded.event_type === "TourUpdated", "publish helper should encode JSON event");

let consumed: unknown;
let acked = false;
let nacked = false;
let consumeHandler: ((message: ConsumeMessage | null) => Promise<void>) | undefined;

await bindJsonConsumer(
  {
    assertExchange: async () => undefined,
    assertQueue: async (queue) => ({ queue }),
    bindQueue: async () => undefined,
    consume: async (_queue, handler) => {
      consumeHandler = handler;
    },
    ack: () => {
      acked = true;
    },
    nack: () => {
      nacked = true;
    },
  },
  "catalog.events",
  "ai_chatbot_catalog_events",
  ["TourUpdated"],
  async (payload) => {
    consumed = payload.payload;
  },
);

assert(consumeHandler, "consumer should register handler");
await consumeHandler({ content: new TextEncoder().encode(JSON.stringify(event)) });
assert((consumed as { id: number }).id === 1, "consumer should decode JSON event");
assert(acked, "consumer should ack successful message");
assert(!nacked, "consumer should not nack successful message");
