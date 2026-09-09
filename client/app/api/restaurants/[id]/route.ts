import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { ConflictError, handleError, NotFoundError } from '@/lib/errors';
import { toRestaurant } from '@/lib/types';
import { parseRestaurantId, validateRestaurantInput } from '@/lib/validation';

type Params = { params: { id: string } };

/**
 * GET /api/restaurants/:id
 * Returns a single restaurant, or 404 if it doesn't exist.
 */
export async function GET(_req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const { rows } = await pool.query(
      'SELECT * FROM restaurants WHERE id = $1',
      [id]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * PUT /api/restaurants/:id
 * Update an existing restaurant.
 *
 * Validates the request body and updates the row matching :id.
 */
export async function PUT(req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const { name, cuisine, address, rating } = validateRestaurantInput(await req.json());
    const existing = await pool.query(
      'SELECT id FROM restaurants WHERE id = $1',
      [id]
    );

    if (existing.rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    const duplicate = await pool.query(
      `SELECT id FROM restaurants
       WHERE LOWER(name) = LOWER($1)
         AND LOWER(COALESCE(address, '')) = LOWER(COALESCE($2, ''))
         AND id <> $3
       LIMIT 1`,
      [name, address, id]
    );

    if (duplicate.rows.length > 0) {
      throw new ConflictError('A restaurant with this name and address already exists');
    }

    const { rows } = await pool.query(
      'UPDATE restaurants SET name = $2, cuisine = $3, address = $4, rating = $5 WHERE id = $1 RETURNING *',
      [id, name, cuisine, address, rating]
    );

    if (rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return NextResponse.json(toRestaurant(rows[0]));
  } catch (err) {
    return handleError(err);
  }
}

/**
 * DELETE /api/restaurants/:id
 * Delete a restaurant.
 *
 * TODO (A2): implement. Delete the row matching :id and return 204 (or 404
 * if it doesn't exist).
 *
 * Worth noticing: the migration already made a call about what happens to that
 * restaurant's visits. Go read it. If you disagree with it, say so in your
 * write-up.
 */
export async function DELETE(_req: Request, { params }: Params) {
  try {
    const id = parseRestaurantId(params.id);
    const result = await pool.query(
      'DELETE FROM restaurants WHERE id = $1',
      [id]
    );

    if (result.rowCount === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return handleError(err);
  }
}
