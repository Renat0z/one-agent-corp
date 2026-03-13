// One Agent Corp — Priority Message Queue
// Domain D-2: In-memory queue — escalation(1) > directive(2) > request(3) > report(4)
// FIFO within same priority level.

import type { Message, Queue, QueueEntry, Priority } from './types';

// ─── PriorityQueue ────────────────────────────────────────────────────────────

export class PriorityQueue implements Queue {
  /** Minimum capacity guaranteed. Enqueue throws if queue is at MAX_QUEUE_SIZE. */
  static readonly MAX_QUEUE_SIZE = 1000;
  /** Minimum messages the queue must be capable of holding (spec requirement: min 10). */
  static readonly MIN_QUEUE_CAPACITY = 10;

  private readonly entries: QueueEntry[] = [];

  /**
   * Enqueue a message. Insertion uses a binary-search to maintain
   * priority order without a full re-sort on every push.
   * Within the same priority, FIFO order is preserved.
   */
  enqueue(message: Message): void {
    if (this.entries.length >= PriorityQueue.MAX_QUEUE_SIZE) {
      throw new Error(
        `PriorityQueue is full (MAX_QUEUE_SIZE=${PriorityQueue.MAX_QUEUE_SIZE}). Drain or dequeue before enqueuing.`
      );
    }

    const entry: QueueEntry = {
      message,
      enqueued_at: new Date().toISOString(),
      attempts: 0,
    };

    // Find the insertion index: after all existing entries with equal or higher priority
    let lo = 0;
    let hi = this.entries.length;

    while (lo < hi) {
      const mid = (lo + hi) >>> 1;
      if (this.entries[mid].message.priority <= message.priority) {
        lo = mid + 1;
      } else {
        hi = mid;
      }
    }

    this.entries.splice(lo, 0, entry);
  }

  /**
   * Dequeue the highest-priority message (lowest numeric priority value).
   * Returns undefined if queue is empty.
   */
  dequeue(): Message | undefined {
    const entry = this.entries.shift();
    return entry?.message;
  }

  /**
   * Peek at the next message without removing it.
   */
  peek(): Message | undefined {
    return this.entries[0]?.message;
  }

  size(): number {
    return this.entries.length;
  }

  isEmpty(): boolean {
    return this.entries.length === 0;
  }

  /**
   * Remove and return all messages, in priority order.
   */
  drain(): Message[] {
    const messages = this.entries.map((e) => e.message);
    this.entries.length = 0;
    return messages;
  }

  /**
   * Non-destructive view of all entries in current priority order.
   */
  getAll(): readonly QueueEntry[] {
    return this.entries;
  }

  clear(): void {
    this.entries.length = 0;
  }

  // ── Extended Utilities ────────────────────────────────────────────────────

  /**
   * Increment attempt count on the head entry (for retry tracking).
   * The message is NOT removed.
   */
  markAttempt(): void {
    if (this.entries.length > 0) {
      this.entries[0].attempts++;
    }
  }

  /**
   * Return all entries that have exceeded a max retry threshold.
   */
  getExhausted(maxAttempts: number): QueueEntry[] {
    return this.entries.filter((e) => e.attempts >= maxAttempts);
  }

  /**
   * Remove all entries that have exceeded the TTL set on their message.
   * Returns the expired entries so callers can log/alert on them.
   */
  evictExpired(): QueueEntry[] {
    const now = Date.now();
    const expired: QueueEntry[] = [];
    const surviving: QueueEntry[] = [];

    for (const entry of this.entries) {
      const ttl = entry.message.ttl_seconds;
      if (ttl !== undefined) {
        const enqueuedMs = Date.parse(entry.enqueued_at);
        if (now - enqueuedMs > ttl * 1000) {
          expired.push(entry);
          continue;
        }
      }
      surviving.push(entry);
    }

    this.entries.length = 0;
    this.entries.push(...surviving);
    return expired;
  }

  /**
   * Filter queue entries by priority level without mutating the queue.
   */
  filterByPriority(priority: Priority): QueueEntry[] {
    return this.entries.filter((e) => e.message.priority === priority);
  }

  /**
   * Return a snapshot of queue depths grouped by priority.
   * Useful for monitoring / dashboard display.
   */
  snapshot(): Record<Priority, number> {
    const counts: Record<Priority, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    for (const entry of this.entries) {
      counts[entry.message.priority]++;
    }
    return counts;
  }
}

// ─── Named Exports (convenience) ─────────────────────────────────────────────

/** Create a fresh PriorityQueue */
export function createQueue(): PriorityQueue {
  return new PriorityQueue();
}
