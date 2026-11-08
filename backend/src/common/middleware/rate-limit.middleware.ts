/**
 * @file rate-limit.middleware.ts
 * @description NestJS middleware wrapping the existing rateLimiter instance.
 * Applies IP-based rate limiting to all API routes for unauthenticated users.
 * The mail unsubscribe route is never limited: every anonymous request
 * through the site's proxy shares one address, and an unsubscribe must work
 * whatever other traffic has used that address's daily allowance.
 */

import { Injectable, NestMiddleware } from '@nestjs/common';
import type { Request, Response, NextFunction } from 'express';
import { rateLimiter } from '../../../middleware/ratelimiter.js';

const UNSUBSCRIBE_PATH = /\/email\/unsubscribe\//i;

/** Cached Express middleware function from the rate limiter. */
let rateLimitMiddlewareFn: ((req: Request, res: Response, next: NextFunction) => void) | null =
  null;

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    if (UNSUBSCRIBE_PATH.test(req.originalUrl || req.url || '')) {
      next();
      return;
    }
    if (!rateLimitMiddlewareFn) {
      rateLimitMiddlewareFn = rateLimiter.middleware();
    }
    rateLimitMiddlewareFn(req, res, next);
  }
}
