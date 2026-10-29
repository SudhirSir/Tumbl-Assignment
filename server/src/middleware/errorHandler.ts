import { Request, Response, NextFunction } from 'express';

/**
 * Mask sensitive data like phone numbers in strings and logs
 */
export function maskSensitiveString(str: string): string {
  // Matches 10-digit Indian numbers starting with 6-9
  return str.replace(/\b([6-9]\d{3})\d{4}(\d{2})\b/g, '$1XXXX$2');
}

/**
 * Custom App Error class for consistent operational errors
 */
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public fields?: Array<{ field: string; message: string }>;
  public metadata?: Record<string, unknown>;

  constructor(
    statusCode: number,
    code: string,
    message: string,
    fields?: Array<{ field: string; message: string }>,
    metadata?: Record<string, unknown>
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.fields = fields;
    this.metadata = metadata;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Global Express error handling middleware.
 * Ensures consistent JSON error shape and never leaks stack traces.
 */
export function globalErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || (err.status ? err.status : 500);
  const code = err.code || (statusCode === 500 ? 'INTERNAL_SERVER_ERROR' : 'ERROR');
  const rawMessage = err.message || 'An unexpected error occurred';
  const safeMessage = maskSensitiveString(rawMessage);

  // Safe server logging with masked sensitive data
  if (statusCode >= 500) {
    console.error(`[Server Error] [${code}] ${safeMessage}`);
  }

  const responseBody: Record<string, any> = {
    error: {
      code,
      message: safeMessage,
      ...(err.fields ? { fields: err.fields } : {}),
      ...(err.metadata ? err.metadata : {}),
    },
  };

  res.status(statusCode).json(responseBody);
}
