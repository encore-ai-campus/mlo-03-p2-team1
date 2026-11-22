-- Auto-generated from live PostgreSQL gold & ai_ready schemas
-- Initializes all Gold Star Schema tables and AI Ready feature/prediction tables.

CREATE SCHEMA IF NOT EXISTS gold;
CREATE SCHEMA IF NOT EXISTS ai_ready;

CREATE TABLE IF NOT EXISTS gold.dim_region (
  "LDONG_CD" text NOT NULL PRIMARY KEY,
  "LDONG_NM" text,
  "SIDO_CD" text,
  "SIDO_NM" text,
  "SGG_CD" text,
  "SGG_NM" text,
  "UMD_NM" text,
  "HAS_OBSERVED_TRADE_YN" boolean
);

CREATE TABLE IF NOT EXISTS gold.dim_date (
  "YQ" text NOT NULL PRIMARY KEY,
  "YR" smallint,
  "QTR" smallint,
  "QTR_BGN_DT" date,
  "QTR_END_DT" date,
  "PROVISIONAL_YN" boolean
);

CREATE TABLE IF NOT EXISTS gold.dim_lcns_induty (
  "ANLS_INDUTY_CD" text NOT NULL PRIMARY KEY,
  "ANLS_INDUTY_NM" text,
  "REFERENCE_YN" boolean
);

CREATE TABLE IF NOT EXISTS gold.fact_apt_idx_qtr (
  "LDONG_CD" text NOT NULL,
  "YQ" text NOT NULL,
  "CPLX_RET_1Q" double precision,
  "CPLX_RET_4Q" double precision,
  "MATCH_CPLX_CNT" bigint,
  "MATCH_TRD_PREV_CNT" bigint,
  "MATCH_TRD_CNT" bigint,
  "PRICE_IDX" double precision,
  "IDX_SEG_NO" bigint,
  "SGG_CPLX_RET_1Q" double precision,
  "SGG_CPLX_RET_4Q" double precision,
  "SEOUL_CPLX_RET_1Q" double precision,
  "SEOUL_CPLX_RET_4Q" double precision,
  PRIMARY KEY ("LDONG_CD", "YQ")
);

CREATE TABLE IF NOT EXISTS gold.fact_apt_trd (
  "SRC_FILE_NM" text NOT NULL,
  "SRC_ROW_NUM" bigint NOT NULL,
  "LDONG_CD" text,
  "YQ" text,
  "DEAL_DTM" date,
  "APT_KEY" text,
  "APT_NM" text,
  "BUILD_YEAR_NUM" bigint,
  "EXCL_AREA_NUM" double precision,
  "FLR_NUM" bigint,
  "DEAL_AMT_NUM" bigint,
  "UNIT_AMT" double precision,
  "LDONG_SRC_CD" text,
  "SAME_DEAL_YN" boolean,
  PRIMARY KEY ("SRC_FILE_NM", "SRC_ROW_NUM")
);

CREATE TABLE IF NOT EXISTS gold.fact_apt_trd_qtr (
  "LDONG_CD" text NOT NULL,
  "YQ" text NOT NULL,
  "TRADE_CNT" bigint,
  "PRICE_SAMPLE_CNT" bigint,
  "UNIT_AMT_MEDIAN" double precision,
  "LOW_SAMPLE_YN" boolean,
  PRIMARY KEY ("LDONG_CD", "YQ")
);

CREATE TABLE IF NOT EXISTS gold.fact_lcns_qtr (
  "LDONG_CD" text NOT NULL,
  "YQ" text NOT NULL,
  "ANLS_INDUTY_CD" text NOT NULL,
  "OPEN_CNT" bigint,
  "CLOSE_CNT" bigint,
  "PROXY_CLOSE_CNT" bigint,
  "ACTIVE_CNT" bigint,
  "NET_CNT" bigint,
  PRIMARY KEY ("LDONG_CD", "YQ", "ANLS_INDUTY_CD")
);

CREATE TABLE IF NOT EXISTS gold.mart_ldong_infra_qtr (
  "LDONG_CD" text NOT NULL,
  "YQ" text NOT NULL,
  "TRADE_CNT" bigint,
  "PRICE_SAMPLE_CNT" bigint,
  "UNIT_AMT_MEDIAN" double precision,
  "LOW_SAMPLE_YN" boolean,
  "LDONG_NM" text,
  "SGG_CD" text,
  "SGG_NM" text,
  "PROVISIONAL_YN" boolean,
  "GENERAL_FOOD_OPEN_CNT" bigint,
  "GENERAL_FOOD_CLOSE_CNT" bigint,
  "GENERAL_FOOD_ACTIVE_CNT" bigint,
  "GENERAL_FOOD_PROXY_CLOSE_CNT" bigint,
  "CAFE_OPEN_CNT" bigint,
  "CAFE_CLOSE_CNT" bigint,
  "CAFE_ACTIVE_CNT" bigint,
  "CAFE_PROXY_CLOSE_CNT" bigint,
  "REST_FOOD_OPEN_CNT" bigint,
  "REST_FOOD_CLOSE_CNT" bigint,
  "REST_FOOD_ACTIVE_CNT" bigint,
  "REST_FOOD_PROXY_CLOSE_CNT" bigint,
  "CLINIC_OPEN_CNT" bigint,
  "CLINIC_CLOSE_CNT" bigint,
  "CLINIC_ACTIVE_CNT" bigint,
  "CLINIC_PROXY_CLOSE_CNT" bigint,
  "PHARMACY_OPEN_CNT" bigint,
  "PHARMACY_CLOSE_CNT" bigint,
  "PHARMACY_ACTIVE_CNT" bigint,
  "PHARMACY_PROXY_CLOSE_CNT" bigint,
  "BEAUTY_OPEN_CNT" bigint,
  "BEAUTY_CLOSE_CNT" bigint,
  "BEAUTY_ACTIVE_CNT" bigint,
  "BEAUTY_PROXY_CLOSE_CNT" bigint,
  "CONVENIENCE_OPEN_CNT" bigint,
  "CONVENIENCE_CLOSE_CNT" bigint,
  "CONVENIENCE_ACTIVE_CNT" bigint,
  "CONVENIENCE_PROXY_CLOSE_CNT" bigint,
  PRIMARY KEY ("LDONG_CD", "YQ")
);

CREATE TABLE IF NOT EXISTS ai_ready.feature_set (
  "LDONG_CD" text NOT NULL,
  "YQ" text NOT NULL,
  "TARGET_YQ" text,
  "SPLIT_NM" text,
  "TARGET_RET" double precision,
  "BASE_UNIT_AMT" double precision,
  "BASE_PRICE_IDX" double precision,
  "BASE_IDX_SEG_NO" bigint,
  "LOG_UNIT_AMT" double precision,
  "MED_RET_1Q" double precision,
  "MED_RET_4Q" double precision,
  "CPLX_RET_1Q" double precision,
  "CPLX_RET_4Q" double precision,
  "CPLX_RET_1Q_LAG1" double precision,
  "LOG_TRADE_CNT" double precision,
  "TRADE_CNT_CHG_4Q" double precision,
  "QTR" bigint,
  "BUILD_AGE_MED" double precision,
  "EXCL_AREA_MED" double precision,
  "REL_SGG_LOG" double precision,
  "SGG_CPLX_RET_1Q" double precision,
  "SGG_CPLX_RET_4Q" double precision,
  "SEOUL_CPLX_RET_1Q" double precision,
  "SEOUL_CPLX_RET_4Q" double precision,
  "GENERAL_FOOD_ACTIVE_LOG" double precision,
  "GENERAL_FOOD_ACTIVE_GR_1Q" double precision,
  "GENERAL_FOOD_ACTIVE_GR_4Q" double precision,
  "GENERAL_FOOD_OPEN_RATE_4Q" double precision,
  "GENERAL_FOOD_CLOSE_RATE_4Q" double precision,
  "CAFE_ACTIVE_LOG" double precision,
  "CAFE_ACTIVE_GR_1Q" double precision,
  "CAFE_ACTIVE_GR_4Q" double precision,
  "CAFE_OPEN_RATE_4Q" double precision,
  "CAFE_CLOSE_RATE_4Q" double precision,
  "REST_FOOD_ACTIVE_LOG" double precision,
  "REST_FOOD_ACTIVE_GR_1Q" double precision,
  "REST_FOOD_ACTIVE_GR_4Q" double precision,
  "REST_FOOD_OPEN_RATE_4Q" double precision,
  "REST_FOOD_CLOSE_RATE_4Q" double precision,
  "CLINIC_ACTIVE_LOG" double precision,
  "CLINIC_ACTIVE_GR_1Q" double precision,
  "CLINIC_ACTIVE_GR_4Q" double precision,
  "CLINIC_OPEN_RATE_4Q" double precision,
  "CLINIC_CLOSE_RATE_4Q" double precision,
  "PHARMACY_ACTIVE_LOG" double precision,
  "PHARMACY_ACTIVE_GR_1Q" double precision,
  "PHARMACY_ACTIVE_GR_4Q" double precision,
  "PHARMACY_OPEN_RATE_4Q" double precision,
  "PHARMACY_CLOSE_RATE_4Q" double precision,
  "BEAUTY_ACTIVE_LOG" double precision,
  "BEAUTY_ACTIVE_GR_1Q" double precision,
  "BEAUTY_ACTIVE_GR_4Q" double precision,
  "BEAUTY_OPEN_RATE_4Q" double precision,
  "BEAUTY_CLOSE_RATE_4Q" double precision,
  "ALL_ACTIVE_LOG" double precision,
  "ALL_ACTIVE_GR_4Q" double precision,
  PRIMARY KEY ("LDONG_CD", "YQ")
);

CREATE TABLE IF NOT EXISTS ai_ready.prediction (
  "LDONG_CD" text NOT NULL,
  "YQ" text NOT NULL,
  "BASE_YQ" text,
  "MODEL_NM" text NOT NULL,
  "MODEL_VER" text,
  "FOLD_YR" bigint,
  "PRED_RET" double precision,
  "ACTUAL_RET" double precision,
  "PRED_IDX" double precision,
  "PRED_UNIT_AMT" double precision,
  PRIMARY KEY ("LDONG_CD", "YQ", "MODEL_NM")
);

CREATE INDEX IF NOT EXISTS idx_mart_ldong_infra_qtr_yq ON gold.mart_ldong_infra_qtr ("YQ");
CREATE INDEX IF NOT EXISTS idx_fact_apt_idx_qtr_yq ON gold.fact_apt_idx_qtr ("YQ");
CREATE INDEX IF NOT EXISTS idx_ai_ready_prediction_yq_model ON ai_ready.prediction ("YQ", "MODEL_NM");
