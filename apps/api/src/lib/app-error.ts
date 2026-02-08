/**
 * Application Error
 * Typed error class for consistent HTTP error responses
 */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown[]
  ) {
    super(message);
    this.name = 'AppError';
  }

  static notFound(code: string, message: string): AppError {
    return new AppError(404, code, message);
  }

  static badRequest(code: string, message: string): AppError {
    return new AppError(400, code, message);
  }

  static conflict(code: string, message: string): AppError {
    return new AppError(409, code, message);
  }

  static forbidden(code: string, message: string): AppError {
    return new AppError(403, code, message);
  }
}
