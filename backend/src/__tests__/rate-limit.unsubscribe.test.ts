import { beforeEach, describe, expect, it, vi } from 'vitest';

// Every anonymous request through the site's proxy shares one address, so a
// daily public limit reached by other traffic must not stop an unsubscribe.
// The limiter here refuses everything it is asked about.
vi.mock('../../middleware/ratelimiter.js', () => ({
  rateLimiter: {
    middleware: () => (_req: unknown, res: { statusCode: number }, _next: () => void) => {
      res.statusCode = 429;
    },
  },
}));

import { RateLimitMiddleware } from '../common/middleware/rate-limit.middleware.js';

type FakeRes = { statusCode: number };

function run(originalUrl: string): { next: ReturnType<typeof vi.fn>; res: FakeRes } {
  const next = vi.fn();
  const res: FakeRes = { statusCode: 200 };
  new RateLimitMiddleware().use(
    { originalUrl, url: originalUrl, method: 'POST' } as never,
    res as never,
    next
  );
  return { next, res };
}

describe('RateLimitMiddleware and the unsubscribe route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('lets an unsubscribe through without counting it', () => {
    const { next, res } = run(`/api/wunderland/email/unsubscribe/${'a'.repeat(43)}`);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.statusCode).toBe(200);
  });

  it('still limits other public requests', () => {
    const { next, res } = run('/api/wunderland/agents');
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
  });
});
