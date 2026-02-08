/**
 * Circuit Breaker Pattern
 * Prevents cascading failures when external services are down.
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing recovery)
 */

import { logger } from './logger.js';

export interface CircuitBreakerOptions {
  /** Descriptive name for logging */
  name: string;
  /** Max time (ms) to wait for the wrapped call */
  timeout: number;
  /** Number of consecutive failures before opening */
  errorThreshold: number;
  /** Time (ms) to wait before transitioning from OPEN to HALF_OPEN */
  resetTimeout: number;
}

export enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private lastFailureTime = 0;

  constructor(private options: CircuitBreakerOptions) {}

  /** Current circuit state (for monitoring/testing) */
  getState(): CircuitState {
    return this.state;
  }

  /** Execute a function through the circuit breaker */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime > this.options.resetTimeout) {
        this.state = CircuitState.HALF_OPEN;
        logger.info('CIRCUIT_BREAKER', `${this.options.name} transitioning to HALF_OPEN`);
      } else {
        throw new Error(`Circuit breaker ${this.options.name} is OPEN`);
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Circuit breaker timeout')),
            this.options.timeout,
          ),
        ),
      ]);
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    if (this.state === CircuitState.HALF_OPEN) {
      logger.info('CIRCUIT_BREAKER', `${this.options.name} recovered, now CLOSED`);
    }
    this.state = CircuitState.CLOSED;
  }

  private onFailure(error: Error): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    if (this.failures >= this.options.errorThreshold) {
      this.state = CircuitState.OPEN;
      logger.warn('CIRCUIT_BREAKER', `${this.options.name} OPENED after ${this.failures} failures`, {
        error: error.message,
        failures: this.failures,
      });
    }
  }
}
