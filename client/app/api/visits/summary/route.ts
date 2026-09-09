import { NextResponse } from 'next/server';
import { pool } from '@/db/pool';
import { handleError } from '@/lib/errors';

/** GET /api/visits/summary */
export async function GET() {
  try {
    const { rows } = await pool.query(
      `SELECT
         COALESCE(SUM(amount) FILTER (
           WHERE visited_at >= date_trunc('month', CURRENT_DATE)
             AND visited_at < date_trunc('month', CURRENT_DATE) + INTERVAL '1 month'
         ), 0) AS this_month,
         COALESCE(SUM(amount) FILTER (
           WHERE visited_at >= date_trunc('year', CURRENT_DATE)
             AND visited_at < date_trunc('year', CURRENT_DATE) + INTERVAL '1 year'
         ), 0) AS this_year
       FROM visits`
    );

    return NextResponse.json({
      thisMonth: Number(rows[0].this_month),
      thisYear: Number(rows[0].this_year),
    });
  } catch (err) {
    return handleError(err);
  }
}
