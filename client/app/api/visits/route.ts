import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError, NotFoundError } from '@/lib/errors';
import { toVisit } from '@/lib/types';
import { validateVisitInput } from '@/lib/validation';

/** GET /api/visits */
export async function GET(req: Request) {
  try {
    const restaurantId = new URL(req.url).searchParams.get('restaurantId');
    let query = `SELECT visits.*, restaurants.name AS restaurant_name
                 FROM visits
                 JOIN restaurants ON restaurants.id = visits."restaurantId"`;
    const values: number[] = [];

    if (restaurantId !== null) {
      if (!/^[1-9]\d*$/.test(restaurantId) || !Number.isSafeInteger(Number(restaurantId))) {
        return NextResponse.json([]);
      }
      query += ' WHERE visits."restaurantId" = $1';
      values.push(Number(restaurantId));
    }

    query += ' ORDER BY visits.date DESC, visits.id DESC';
    const { rows } = await pool.query(query, values);
    return NextResponse.json(rows.map(toVisit));
  } catch (err) {
    return handleError(err);
  }
}

/** POST /api/visits */
export async function POST(req: Request) {
  try {
    const { restaurantId, amount, visitedAt } = validateVisitInput(await req.json());
    const restaurant = await pool.query(
      'SELECT name FROM restaurants WHERE id = $1',
      [restaurantId]
    );

    if (restaurant.rows.length === 0) {
      throw new NotFoundError('Restaurant not found');
    }

    const { rows } = await pool.query(
      'INSERT INTO visits ("restaurantId", "amountSpent", date) VALUES ($1, $2, $3) RETURNING *',
      [restaurantId, amount, visitedAt]
    );

    return NextResponse.json(
      toVisit({ ...rows[0], restaurant_name: restaurant.rows[0].name }),
      { status: 201 }
    );
  } catch (err) {
    return handleError(err);
  }
}
