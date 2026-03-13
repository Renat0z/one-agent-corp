// One Agent Corp — Message Router
// Domain D-2: Strategy-pattern router — routes by type, destination, priority

import type {
  Message,
  MessageType,
  ActorId,
  Router,
  RoutingResult,
  MessageHandler,
} from './types';
import { assertValidMessage } from './schemas';

// ─── Middleware ───────────────────────────────────────────────────────────────

export type RouterMiddleware = (message: Message, next: () => void) => void;

// ─── MessageRouter ────────────────────────────────────────────────────────────

export class MessageRouter implements Router {
  private readonly handlers = new Map<ActorId, MessageHandler>();
  private readonly typeInterceptors = new Map<MessageType, MessageHandler[]>();
  private readonly middleware: RouterMiddleware[] = [];
  private readonly deliveryLog: RoutingResult[] = [];

  // ── Registration ──────────────────────────────────────────────────────────

  register(destination: ActorId, handler: MessageHandler): void {
    if (this.handlers.has(destination)) {
      throw new Error(`Handler already registered for destination '${destination}'. Call unregister first.`);
    }
    this.handlers.set(destination, handler);
  }

  unregister(destination: ActorId): void {
    this.handlers.delete(destination);
  }

  /**
   * Register a handler that receives ALL messages of a given type,
   * regardless of the primary destination (useful for logging, auditing).
   */
  interceptType(type: MessageType, handler: MessageHandler): void {
    const list = this.typeInterceptors.get(type) ?? [];
    list.push(handler);
    this.typeInterceptors.set(type, list);
  }

  /** Add middleware executed before routing (e.g. auth, rate-limiting) */
  use(middleware: RouterMiddleware): void {
    this.middleware.push(middleware);
  }

  getHandlers(): ReadonlyMap<ActorId, MessageHandler> {
    return this.handlers;
  }

  // ── Routing ───────────────────────────────────────────────────────────────

  route(message: Message): RoutingResult {
    // 1. Validate structure
    try {
      assertValidMessage(message);
    } catch (err) {
      const result: RoutingResult = {
        delivered: false,
        destination: message.to,
        timestamp: new Date().toISOString(),
        error: err instanceof Error ? err.message : String(err),
      };
      this.deliveryLog.push(result);
      return result;
    }

    // 2. Run middleware chain
    let aborted = false;
    const middlewareCopy = [...this.middleware];
    const runMiddleware = (index: number): void => {
      if (index >= middlewareCopy.length) return;
      middlewareCopy[index](message, () => runMiddleware(index + 1));
    };
    try {
      runMiddleware(0);
    } catch (err) {
      const result: RoutingResult = {
        delivered: false,
        destination: message.to,
        timestamp: new Date().toISOString(),
        error: `Middleware rejected message: ${err instanceof Error ? err.message : String(err)}`,
      };
      this.deliveryLog.push(result);
      return result;
    }

    // 3. Fire type interceptors (non-blocking, fire-and-forget)
    const interceptors = this.typeInterceptors.get(message.type) ?? [];
    for (const interceptor of interceptors) {
      try {
        void interceptor(message);
      } catch {
        // Interceptors must not fail routing
      }
    }

    // 4. Resolve destinations
    const destinations: ActorId[] = Array.isArray(message.to)
      ? message.to
      : [message.to];

    const errors: string[] = [];
    let deliveredCount = 0;

    for (const destination of destinations) {
      const handler = this.handlers.get(destination);
      if (!handler) {
        errors.push(`No handler registered for destination '${destination}'`);
        continue;
      }
      try {
        void handler(message);
        deliveredCount++;
      } catch (err) {
        errors.push(
          `Handler for '${destination}' threw: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }

    const partialDelivery = deliveredCount > 0 && errors.length > 0;
    const fullDelivery = deliveredCount === destinations.length && errors.length === 0;

    const result: RoutingResult = {
      delivered: fullDelivery,
      destination: message.to,
      timestamp: new Date().toISOString(),
      error: errors.length > 0
        ? (partialDelivery
            ? `Partial delivery (${deliveredCount}/${destinations.length}): ${errors.join('; ')}`
            : errors.join('; '))
        : undefined,
    };

    this.deliveryLog.push(result);
    return result;
  }

  // ── Utilities ─────────────────────────────────────────────────────────────

  /** Returns a copy of the delivery log for auditing */
  getDeliveryLog(): ReadonlyArray<RoutingResult> {
    return [...this.deliveryLog];
  }

  /** Check whether a destination has a registered handler */
  hasHandler(destination: ActorId): boolean {
    return this.handlers.has(destination);
  }

  /** Route multiple messages in priority order (lowest number = highest priority) */
  routeBatch(messages: Message[]): RoutingResult[] {
    const sorted = [...messages].sort((a, b) => a.priority - b.priority);
    return sorted.map((m) => this.route(m));
  }

  /** Clear all handlers, interceptors, middleware, and log */
  reset(): void {
    this.handlers.clear();
    this.typeInterceptors.clear();
    this.middleware.length = 0;
    this.deliveryLog.length = 0;
  }
}

// ─── Singleton Factory ────────────────────────────────────────────────────────

let _globalRouter: MessageRouter | null = null;

/** Returns the application-wide router instance (lazy-init singleton) */
export function getGlobalRouter(): MessageRouter {
  if (!_globalRouter) {
    _globalRouter = new MessageRouter();
  }
  return _globalRouter;
}

/** Replace the global router — useful in tests */
export function setGlobalRouter(router: MessageRouter): void {
  _globalRouter = router;
}
