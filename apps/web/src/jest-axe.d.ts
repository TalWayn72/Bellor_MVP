/**
 * Type declarations for jest-axe v10+
 * Provides types for axe() and toHaveNoViolations matcher
 */

declare module 'jest-axe' {
  import type { AxeResults, RunOptions, Spec } from 'axe-core';

  interface JestAxeConfigureOptions {
    globalOptions?: Spec;
    impactLevels?: string[];
    rules?: Record<string, unknown>;
  }

  function axe(
    html: Element | string,
    options?: RunOptions
  ): Promise<AxeResults>;

  function configureAxe(options: JestAxeConfigureOptions): typeof axe;

  const toHaveNoViolations: {
    toHaveNoViolations(results: AxeResults): { pass: boolean; message(): string };
  };

  export { axe, configureAxe, toHaveNoViolations };
}
