import { z } from 'zod';

const uuid = z.string().uuid();

export const shipmentProvider = z.enum(['local', 'gig', 'dhl']);

export const createShipmentSchema = z
  .object({
    orderId: uuid,
    provider: shipmentProvider.default('local'),
    trackingRef: z.string().trim().max(120).default(''),
  })
  .strict();

export const shipmentEventSchema = z
  .object({
    status: z.enum(['preparing', 'dispatched', 'in_transit', 'delivered', 'failed']),
    location: z.string().trim().max(120).default(''),
    note: z.string().trim().max(500).default(''),
  })
  .strict();
