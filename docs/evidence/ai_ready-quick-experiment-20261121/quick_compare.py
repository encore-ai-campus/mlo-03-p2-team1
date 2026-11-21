"""빠른 비교 실험: 기준선 / 집값만 / 집값+상권. 저장소에는 아무것도 쓰지 않는다."""
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

GOLD = Path(sys.argv[1])
MIN_N = 5
TRAIN_END, VALID_END, LAST = "2023Q4", "2024Q4", "2026Q3"
GROUPS = ["GENERAL_FOOD", "CAFE", "CLINIC", "PHARMACY", "BEAUTY"]

m = pd.read_parquet(GOLD / "04_gold__mart_ldong_infra_qtr.parquet")
m = m.sort_values(["LDONG_CD", "YQ"]).reset_index(drop=True)
g = m.groupby("LDONG_CD")

# 가격: 5건 이상일 때만 사용
m["LP"] = np.where(m.PRICE_SAMPLE_CNT >= MIN_N, np.log(m.UNIT_AMT_MEDIAN), np.nan)
lp = g["LP"]
m["TARGET"] = lp.shift(-1) - m.LP
m["TARGET_YQ"] = g["YQ"].shift(-1)

# ── 집값 피처 ──
m["RET_1Q"] = m.LP - lp.shift(1)
m["RET_4Q"] = m.LP - lp.shift(4)
m["LOG_N"] = np.log1p(m.PRICE_SAMPLE_CNT)
m["N_CHG_4Q"] = m.LOG_N - g["PRICE_SAMPLE_CNT"].shift(4).pipe(np.log1p)
m["QTR"] = m.YQ.str[-1].astype(int)

t = pd.read_parquet(GOLD / "04_gold__fact_apt_trd.parquet",
                    columns=["LDONG_CD", "YQ", "UNIT_AMT", "BUILD_YEAR_NUM", "EXCL_AREA_NUM"])
t = t.merge(m[["LDONG_CD", "SGG_CD"]].drop_duplicates(), on="LDONG_CD")
t["AGE"] = t.YQ.str[:4].astype(int) - t.BUILD_YEAR_NUM
comp = t.groupby(["LDONG_CD", "YQ"]).agg(AGE_MED=("AGE", "median"), AREA_MED=("EXCL_AREA_NUM", "median"))
sgg = np.log(t.groupby(["SGG_CD", "YQ"]).UNIT_AMT.median()).rename("SGG_LP").reset_index()
seoul = np.log(t.groupby("YQ").UNIT_AMT.median()).rename("SEOUL_LP").reset_index()
m = m.merge(comp.reset_index(), on=["LDONG_CD", "YQ"], how="left")
m = m.merge(sgg, on=["SGG_CD", "YQ"], how="left").merge(seoul, on="YQ", how="left")
m = m.sort_values(["LDONG_CD", "YQ"]).reset_index(drop=True)
g = m.groupby("LDONG_CD")
m.loc[m.LP.isna(), ["AGE_MED", "AREA_MED"]] = np.nan
m["REL_SGG"] = m.LP - m.SGG_LP
m["SGG_RET_1Q"] = m.SGG_LP - g["SGG_LP"].shift(1)
m["SGG_RET_4Q"] = m.SGG_LP - g["SGG_LP"].shift(4)
m["SEOUL_RET_1Q"] = m.SEOUL_LP - g["SEOUL_LP"].shift(1)
m["SEOUL_RET_4Q"] = m.SEOUL_LP - g["SEOUL_LP"].shift(4)
PRICE = ["LP", "RET_1Q", "RET_4Q", "LOG_N", "N_CHG_4Q", "QTR", "AGE_MED", "AREA_MED",
         "REL_SGG", "SGG_RET_1Q", "SGG_RET_4Q", "SEOUL_RET_1Q", "SEOUL_RET_4Q"]

# ── 상권 피처 (인허가, 분기 t까지) ──
LCNS = []
for grp in GROUPS:
    a = np.log1p(m[f"{grp}_ACTIVE_CNT"])
    m[f"{grp}_ACT"] = a
    m[f"{grp}_GR_1Q"] = a - g[f"{grp}_ACTIVE_CNT"].shift(1).pipe(np.log1p)
    m[f"{grp}_GR_4Q"] = a - g[f"{grp}_ACTIVE_CNT"].shift(4).pipe(np.log1p)
    o4 = g[f"{grp}_OPEN_CNT"].transform(lambda s: s.rolling(4).sum())
    c4 = g[f"{grp}_CLOSE_CNT"].transform(lambda s: s.rolling(4).sum())
    m[f"{grp}_OPEN_R4"] = o4 / (m[f"{grp}_ACTIVE_CNT"] + 1)
    m[f"{grp}_CLOSE_R4"] = c4 / (m[f"{grp}_ACTIVE_CNT"] + 1)
    LCNS += [f"{grp}_{s}" for s in ("ACT", "GR_1Q", "GR_4Q", "OPEN_R4", "CLOSE_R4")]
tot = m[[f"{grp}_ACTIVE_CNT" for grp in GROUPS]].sum(axis=1)
m["ALL_ACT"] = np.log1p(tot)
m["ALL_GR_4Q"] = m.ALL_ACT - np.log1p(tot.groupby(m.LDONG_CD).shift(4))
LCNS += ["ALL_ACT", "ALL_GR_4Q"]

# ── 행 선택·분할 (타깃 분기 기준) ──
d = m[m.TARGET.notna() & (m.TARGET_YQ <= LAST)].copy()
d["SPLIT"] = np.select([d.TARGET_YQ <= TRAIN_END, d.TARGET_YQ <= VALID_END], ["train", "valid"], "test")
print("rows", d.SPLIT.value_counts().to_dict(), "dongs", d.LDONG_CD.nunique())

PARAMS = dict(objective="l2", learning_rate=0.03, num_leaves=15, min_data_in_leaf=40,
              feature_fraction=0.8, bagging_fraction=0.8, bagging_freq=1, lambda_l2=1.0,
              seed=7, deterministic=True, force_col_wise=True, verbose=-1, num_threads=1)


def fit_predict(cols):
    tr, va = d[d.SPLIT == "train"], d[d.SPLIT == "valid"]
    model = lgb.train(PARAMS, lgb.Dataset(tr[cols], tr.TARGET), 3000,
                      valid_sets=[lgb.Dataset(va[cols], va.TARGET)],
                      callbacks=[lgb.early_stopping(100, verbose=False)])
    return model, model.predict(d[cols], num_iteration=model.best_iteration)


d["P_BASE"] = 0.0
mdl_p, d["P_PRICE"] = fit_predict(PRICE)
mdl_l, d["P_LCNS"] = fit_predict(PRICE + LCNS)
print("best_iter", mdl_p.best_iteration, mdl_l.best_iteration)


def metrics(s, col):
    true_p = np.exp(s.LP + s.TARGET)
    pred_p = np.exp(s.LP + s[col])
    mape = (np.abs(pred_p - true_p) / true_p).mean() * 100
    mae = np.abs(s[col] - s.TARGET).mean() * 100
    nz = s.TARGET != 0
    direction = (np.sign(s[col][nz]) == np.sign(s.TARGET[nz])).mean() * 100 if col != "P_BASE" else np.nan
    return mape, mae, direction


rows = []
for split in ["valid", "test"]:
    s = d[d.SPLIT == split]
    base = metrics(s, "P_BASE")[0]
    for name, col in [("1 기준선", "P_BASE"), ("2 집값만", "P_PRICE"), ("3 집값+상권", "P_LCNS")]:
        mape, mae, dirc = metrics(s, col)
        rows.append([split, name, len(s), round(mape, 2), round((base - mape) / base * 100, 1), round(dirc, 1)])
out = pd.DataFrame(rows, columns=["split", "model", "rows", "MAPE%", "기준선대비감소%", "방향정확도%"])
print(out.to_string(index=False))

# 테스트: 거래 규모별
s = d[d.SPLIT == "test"].copy()
s["BIN"] = pd.cut(s.PRICE_SAMPLE_CNT, [4, 9, 19, 49, 10**6], labels=["5-9", "10-19", "20-49", "50+"])
r = []
for b, x in s.groupby("BIN", observed=True):
    r.append([b, len(x)] + [round(metrics(x, c)[0], 2) for c in ("P_BASE", "P_PRICE", "P_LCNS")])
print(pd.DataFrame(r, columns=["거래수", "rows", "기준선", "집값만", "집값+상권"]).to_string(index=False))

# 분기별 테스트 MAPE
r = []
for q, x in s.groupby("TARGET_YQ"):
    r.append([q, len(x)] + [round(metrics(x, c)[0], 2) for c in ("P_BASE", "P_PRICE", "P_LCNS")])
print(pd.DataFrame(r, columns=["타깃분기", "rows", "기준선", "집값만", "집값+상권"]).to_string(index=False))

# 상권 피처 중요도 (gain 비중)
imp = pd.Series(mdl_l.feature_importance("gain"), index=PRICE + LCNS)
print("LCNS gain share %.1f%%" % (imp[LCNS].sum() / imp.sum() * 100))
print((imp / imp.sum() * 100).round(1).sort_values(ascending=False).head(12).to_string())

# 부트스트랩: 동 단위 재표본으로 3 vs 2 MAPE 차이의 신뢰구간
rng = np.random.default_rng(0)
s["E2"] = np.abs(np.exp(s.LP + s.P_PRICE) / np.exp(s.LP + s.TARGET) - 1)
s["E3"] = np.abs(np.exp(s.LP + s.P_LCNS) / np.exp(s.LP + s.TARGET) - 1)
per = s.groupby("LDONG_CD")[["E2", "E3"]].agg(["sum", "count"])
dongs = per.index.to_numpy()
diffs = []
for _ in range(2000):
    pick = per.loc[rng.choice(dongs, len(dongs))]
    n = pick[("E2", "count")].sum()
    diffs.append((pick[("E3", "sum")].sum() - pick[("E2", "sum")].sum()) / n * 100)
print("MAPE(3)-MAPE(2) %%p: mean %.3f, 95%% CI [%.3f, %.3f]" % (np.mean(diffs), *np.percentile(diffs, [2.5, 97.5])))
