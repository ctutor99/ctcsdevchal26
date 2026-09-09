import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { ConflictError, handleError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';
import { validateRestaurantInput } from '@/lib/validation';

/**
 * GET /api/restaurants
 * Returns all restaurants.
 */
export async function GET() {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM restaurants ORDER BY created_at DESC'
    );
    // Map every row - raw rows don't match the contract (NUMERIC comes back
    // as a string, timestamps as Date objects). See lib/types.ts.
    return NextResponse.json(rows.map(toRestaurant));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * POST /api/restaurants
 * Create a new restaurant.
 *
 * Validates the request body, inserts a row, and returns the created restaurant.
 */
export async function POST(req: Request) {
  try {
    const { name, cuisine, address, rating } = validateRestaurantInput(await req.json());
    const duplicate = await pool.query(
      `SELECT id FROM restaurants
       WHERE LOWER(name) = LOWER($1)
         AND LOWER(COALESCE(address, '')) = LOWER(COALESCE($2, ''))
       LIMIT 1`,
      [name, address]
    );

    if (duplicate.rows.length > 0) {
      throw new ConflictError('A restaurant with this name and address already exists');
    }

    const result = await pool.query(
      'INSERT INTO restaurants (name, cuisine, address, rating) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, cuisine, address, rating]
    );

    return NextResponse.json(toRestaurant(result.rows[0]), { status: 201 });
  } catch (err) {
    return handleError(err);
  }
}
