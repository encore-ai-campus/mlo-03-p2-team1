from psycopg.rows import dict_row

from ... import db


def quarters() -> list[dict]:
    with db.connect() as connection, connection.cursor(row_factory=dict_row) as cursor:
        return cursor.execute("""
            SELECT substring(yq, 1, 4)::integer AS year,
                   right(yq, 1)::integer AS quarter,
                   bool_or(observed) AS has_observations,
                   bool_or(priced) AS has_market_prices,
                   bool_or(predicted) AS has_predictions
            FROM (
                SELECT d.yq, EXISTS (
                    SELECT 1 FROM dashboard_gold.fact_apt_trd_qtr AS t WHERE t.yq = d.yq AND t.trade_count > 0
                    UNION ALL
                    SELECT 1 FROM dashboard_gold.fact_lcns_qtr AS l WHERE l.yq = d.yq
                      AND (l.active_count > 0 OR l.open_count > 0 OR l.close_count > 0)
                ) AS observed, EXISTS (
                    SELECT 1 FROM dashboard_gold.fact_apt_trd_qtr AS t WHERE t.yq = d.yq AND t.priced_count > 0
                ) AS priced, false AS predicted FROM dashboard_gold.dim_date AS d
                UNION ALL
                SELECT DISTINCT yq, false, false, true FROM dashboard_gold.fact_apt_prediction
            ) AS available
            GROUP BY yq
            ORDER BY yq
        """).fetchall()


def regions(yq: str, region_code: str | None) -> list[dict]:
    with db.connect() as connection, connection.cursor(row_factory=dict_row) as cursor:
        return cursor.execute("""
            SELECT r.ldong_cd AS region_code, r.ldong_nm AS region_name,
                   r.sgg_cd AS district_code, r.sgg_nm AS district_name, d.provisional,
                   m.trade_count, m.priced_count, m.price_per_sqm_won, m.actual_growth_pct,
                   p.predicted_rise, p.rise_probability,
                   p.model_version, p.model_fit_through, p.prediction_kind,
                   coalesce(m.license_metrics, '[]'::jsonb) AS license_metrics
            FROM dashboard_gold.dim_region AS r
            LEFT JOIN dashboard_gold.mart_ldong_infra_qtr AS m ON m.ldong_cd = r.ldong_cd AND m.yq = %s
            LEFT JOIN dashboard_gold.fact_apt_prediction AS p ON p.ldong_cd = r.ldong_cd AND p.yq = %s
            LEFT JOIN dashboard_gold.dim_date AS d ON d.yq = m.yq
            WHERE (m.yq IS NOT NULL OR p.yq IS NOT NULL)
              AND (%s::text IS NULL OR r.ldong_cd = %s)
            ORDER BY r.ldong_cd
        """, (yq, yq, region_code, region_code)).fetchall()
