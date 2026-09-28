import { describe, expect, it } from 'vitest';
import { sanitizeForAudit } from '@/modules/audit/service';
import {
  renderCartAbandoned,
  renderOrderCreated,
  renderOrderPaid,
  renderShipmentUpdate,
} from '@/lib/email';

// THREAT (secrets/PII leaking into logs/audit) → CONTROL (deep redaction at
// the audit boundary) → TEST: every secret-shaped key redacted, data intact.
describe('audit sanitization', () => {
  it('redacts secret-bearing keys at any depth, keeps the rest', () => {
    const out = sanitizeForAudit({
      email: 'ada@example.com',
      password: 'hunter2',
      nested: { api_key: 'sk-x', amount: 500 },
      list: [{ token: 't', id: 1 }],
      CVV: '123',
      cardNumber: '4111',
    }) as Record<string, unknown>;
    expect(out.email).toBe('ada@example.com');
    expect(out.password).toBe('[redacted]');
    expect((out.nested as Record<string, unknown>).api_key).toBe('[redacted]');
    expect((out.nested as Record<string, unknown>).amount).toBe(500);
    expect(((out.list as unknown[])[0] as Record<string, unknown>).token).toBe('[redacted]');
    expect(out.CVV).toBe('[redacted]');
    expect(out.cardNumber).toBe('[redacted]');
  });

  it('passes primitives through untouched', () => {
    expect(sanitizeForAudit('x')).toBe('x');
    expect(sanitizeForAudit(42)).toBe(42);
    expect(sanitizeForAudit(null)).toBe(null);
  });
});

describe('notification templates', () => {
  it('renders order lifecycle emails with naira formatting, no secrets', () => {
    const created = renderOrderCreated({ orderNumber: 'DES-ABC123', totalKobo: 2550000 });
    expect(created.subject).toContain('DES-ABC123');
    expect(created.text).toContain('₦25,500');
    const paid = renderOrderPaid({ orderNumber: 'DES-ABC123', totalKobo: 2550000 });
    expect(paid.subject).toMatch(/confirmed/i);
    const ship = renderShipmentUpdate({ orderNumber: 'DES-ABC123', status: 'in_transit', trackingRef: 'GIG-1' });
    expect(ship.text).toContain('GIG-1');
    expect(ship.text).toContain('in transit');
  });

  it('renders abandoned-cart reminders with line items', () => {
    const msg = renderCartAbandoned({
      lines: [{ name: 'Golden Oil', qty: 2, priceNgn: 24000 }],
      subtotalNgn: 48000,
    });
    expect(msg.text).toContain('Golden Oil');
    expect(msg.text).toContain('48,000');
    expect(msg.text).toMatch(/48 hours/);
  });
});
