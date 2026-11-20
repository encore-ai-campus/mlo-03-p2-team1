CREATE SCHEMA IF NOT EXISTS dashboard_gold;

CREATE TABLE IF NOT EXISTS dashboard_gold.dim_region (
    ldong_cd text PRIMARY KEY CHECK (ldong_cd ~ '^[0-9]{10}$'),
    ldong_nm text NOT NULL,
    sido_cd text NOT NULL,
    sido_nm text,
    sgg_cd text NOT NULL,
    sgg_nm text,
    umd_nm text
);

CREATE TABLE IF NOT EXISTS dashboard_gold.dim_date (
    yq text PRIMARY KEY,
    year integer NOT NULL,
    quarter integer NOT NULL CHECK (quarter BETWEEN 1 AND 4),
    start_date date NOT NULL,
    end_date date NOT NULL CHECK (end_date >= start_date),
    provisional boolean NOT NULL,
    UNIQUE (year, quarter)
);

CREATE TABLE IF NOT EXISTS dashboard_gold.dim_lcns_induty (
    industry_code text PRIMARY KEY,
    reference_only boolean NOT NULL
);

CREATE TABLE IF NOT EXISTS dashboard_gold.fact_apt_trd_qtr (
    ldong_cd text REFERENCES dashboard_gold.dim_region,
    yq text REFERENCES dashboard_gold.dim_date,
    trade_count bigint NOT NULL CHECK (trade_count >= 0),
    priced_count bigint NOT NULL CHECK (priced_count BETWEEN 0 AND trade_count),
    price_per_sqm_won double precision CHECK (price_per_sqm_won > 0),
    PRIMARY KEY (ldong_cd, yq)
);

CREATE TABLE IF NOT EXISTS dashboard_gold.fact_lcns_qtr (
    ldong_cd text REFERENCES dashboard_gold.dim_region,
    yq text REFERENCES dashboard_gold.dim_date,
    industry_code text REFERENCES dashboard_gold.dim_lcns_induty,
    open_count bigint NOT NULL CHECK (open_count >= 0),
    close_count bigint NOT NULL CHECK (close_count >= 0),
    active_count bigint NOT NULL CHECK (active_count >= 0),
    proxy_close_count bigint NOT NULL CHECK (proxy_close_count BETWEEN 0 AND close_count),
    PRIMARY KEY (ldong_cd, yq, industry_code)
);

CREATE TABLE IF NOT EXISTS dashboard_gold.mart_ldong_infra_qtr (
    ldong_cd text REFERENCES dashboard_gold.dim_region,
    yq text REFERENCES dashboard_gold.dim_date,
    trade_count bigint NOT NULL CHECK (trade_count >= 0),
    priced_count bigint NOT NULL CHECK (priced_count BETWEEN 0 AND trade_count),
    price_per_sqm_won double precision,
    actual_growth_pct double precision,
    license_metrics jsonb NOT NULL,
    PRIMARY KEY (ldong_cd, yq)
);

CREATE TABLE IF NOT EXISTS dashboard_gold.fact_apt_prediction (
    ldong_cd text REFERENCES dashboard_gold.dim_region,
    yq text CHECK (yq ~ '^[0-9]{4}Q[1-4]$'),
    predicted_rise boolean NOT NULL,
    rise_probability double precision NOT NULL CHECK (rise_probability BETWEEN 0 AND 1),
    model_version text NOT NULL,
    model_fit_through text REFERENCES dashboard_gold.dim_date NOT NULL,
    prediction_kind text NOT NULL CHECK (prediction_kind IN ('holdout', 'forecast')),
    PRIMARY KEY (ldong_cd, yq)
);

CREATE INDEX IF NOT EXISTS dashboard_mart_quarter_idx ON dashboard_gold.mart_ldong_infra_qtr (yq);
CREATE INDEX IF NOT EXISTS dashboard_prediction_quarter_idx ON dashboard_gold.fact_apt_prediction (yq);
