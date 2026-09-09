import { NextResponse } from 'next/server';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends ApiError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string) {
    super(message, 404);
  }
}

export class ConflictError extends ApiError {
  constructor(message: string) {
    super(message, 409);
  }
}

function postgresErrorCode(err: unknown): string | undefined {
  if (typeof err !== 'object' || err === null || !('code' in err)) {
    return undefined;
  }

  return typeof err.code === 'string' ? err.code : undefined;
}

/**
 * Central error -> HTTP response mapper for the API route handlers. Call it
 * from a route's `catch` block so error handling lives in one place:
 *
 *   try {
 *     ...
 *   } catch (err) {
 *     return handleError(err);
 *   }
 *
 * Known failures are returned with a useful 4xx response. Unexpected failures
 * are logged on the server, but their internal details are never sent back to
 * the client.
 */
export function handleError(err: unknown): NextResponse {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }

  if (err instanceof SyntaxError) {
    return NextResponse.json({ error: 'Request body must be valid JSON' }, { status: 400 });
  }

  const code = postgresErrorCode(err);
  if (code === '23505' || code === '23503') {
    return NextResponse.json({ error: 'Request conflicts with existing data' }, { status: 409 });
  }

  if (code === '22P02' || code === '23502' || code === '23514') {
    return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
  }

  console.error('Unhandled API error:', err);

  return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
}
