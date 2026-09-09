import { NotFoundError, ValidationError } from '@/lib/errors';

export interface RestaurantInput {
  name: string;
  cuisine: string | null;
  address: string | null;
  rating: number | null;
}

const restaurantFields = new Set(['name', 'cuisine', 'address', 'rating']);

function optionalText(
  body: Record<string, unknown>,
  field: 'cuisine' | 'address',
  maxLength: number
): string | null {
  const value = body[field];

  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value !== 'string') {
    throw new ValidationError(`${field} must be a string or null`);
  }

  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new ValidationError(`${field} must be ${maxLength} characters or fewer`);
  }

  return trimmed || null;
}

export function validateRestaurantInput(value: unknown): RestaurantInput {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError('Request body must be a JSON object');
  }

  const body = value as Record<string, unknown>;
  const unknownField = Object.keys(body).find((field) => !restaurantFields.has(field));
  if (unknownField) {
    throw new ValidationError(`Unknown field: ${unknownField}`);
  }

  if (typeof body.name !== 'string' || body.name.trim().length === 0) {
    throw new ValidationError('name is required and must be a non-empty string');
  }

  const name = body.name.trim();
  if (name.length > 200) {
    throw new ValidationError('name must be 200 characters or fewer');
  }

  const rating = body.rating;
  if (
    rating !== undefined &&
    rating !== null &&
    (typeof rating !== 'number' || !Number.isFinite(rating) || rating < 0 || rating > 5)
  ) {
    throw new ValidationError('rating must be a number between 0 and 5, or null');
  }

  return {
    name,
    cuisine: optionalText(body, 'cuisine', 100),
    address: optionalText(body, 'address', 500),
    rating: rating === undefined ? null : rating,
  };
}

export function parseRestaurantId(value: string): number {
  if (!/^[1-9]\d*$/.test(value)) {
    throw new NotFoundError('Restaurant not found');
  }

  const id = Number(value);
  if (!Number.isSafeInteger(id)) {
    throw new NotFoundError('Restaurant not found');
  }

  return id;
}
