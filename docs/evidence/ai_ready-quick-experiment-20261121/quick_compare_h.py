"""빠른 비교 실험 (같은 단지 기준 변화율). 저장소에는 아무것도 쓰지 않는다.

타깃: 법정동 d, 분기 t → t+1. 두 분기에 모두 거래된 단지끼리 ㎡당 가격 중앙값의 로그 변화를 구하고,
      단지별 min(n_t, n_t+1) 가중 평균. 매칭된 단지의 거래 수가 t, t+1 각각 5건 이상일 때만 사용.
"""
import sys
from pathlib import Path

import lightgbm as lgb
import numpy as np
import pandas as pd

GOLD = Path(sys.argv[1])
MIN_N = 5
H = int(sys.argv[2]) if len(sys.argv) > 2 else 1
TRAIN_END, VALID_END, LAST = "2023Q4", "2024Q4", "2026Q3"
GROUPS = ["GENERAL_FOOD", "CAFE", "CLINIC", "PHARMACY", "BEAUTY"]

m = pd.read_parquet(GOLD / "04_gold__mart_ldong_infra_qtr.parquet")
m = m.sort_values(["LDONG_CD", "YQ"]).reset_index(drop=True)
m["QI"] = pd.PeriodIndex(m.YQ, freq="Q").astype("int64")

# ── 단지 × 분기 ──
t = pd.read_parquet(GOLD / "04_gold__fact_apt_trd.parquet",
                    columns=["LDONG_CD", "YQ", "APT_KEY", "UNIT_AMT", "BUILD_YEAR_NUM", "EXCL_AREA_NUM"])
t["QI"] = pd.PeriodIndex(t.YQ, freq="Q").astype("int64")
t["LU"] = np.log(t.UNIT_AMT)
c = t.groupby(["LDONG_CD", "APT_KEY", "QI"]).agg(N=("LU", "size"), LU=("LU", "median")).reset_index()


def cplx_change(lag):
    """분기 QI-lag → QI 의 같은 단지 변화율 (QI 시점 기준 행)."""
    prev = c.assign(QI=c.QI + lag)
    j = c.merge(prev, on=["LDONG_CD", "APT_KEY", "QI"], suffixes=("", "_P"))
    j["W"] = np.minimum(j.N, j.N_P)
    j["WD"] = j.W * (j.LU - j.LU_P)
    a = j.groupby(["LDONG_CD", "QI"]).agg(WD=("WD", "sum"), W=("W", "sum"), N1=("N", "sum"), N0=("N_P", "sum"),
                                          NC=("APT_KEY", "size"))
    a["CHG"] = a.WD / a.W
    a.loc[(a.N1 < MIN_N) | (a.N0 < MIN_N), "CHG"] = np.nan
    return a[["CHG", "NC", "N0", "N1"]]


c1 = cplx_change(1)   # t-1 → t
c4 = cplx_change(4)   # t-4 → t
m = m.merge(c1.rename(columns={"CHG": "C_RET_1Q", "NC": "NC_1Q", "N0": "N0_1Q", "N1": "N1_1Q"}).reset_index(),
            on=["LDONG_CD", "QI"], how="left")
m = m.merge(c4[["CHG"]].rename(columns={"CHG": "C_RET_4Q"}).reset_index(), on=["LDONG_CD", "QI"], how="left")
m = m.sort_values(["LDONG_CD", "QI"]).reset_index(drop=True)
g = m.groupby("LDONG_CD")
m["TARGET"] = g["C_RET_1Q" if H == 1 else "C_RET_4Q"].shift(-H)

m["TARGET_YQ"] = g["YQ"].shift(-H)

# ── 집값 피처 (분기 t까지) ──
m["LP"] = np.where(m.PRICE_SAMPLE_CNT >= MIN_N, np.log(m.UNIT_AMT_MEDIAN), np.nan)
m["RET_1Q"] = m.LP - g["LP"].shift(1)
m["RET_4Q"] = m.LP - g["LP"].shift(4)
m["C_RET_1Q_L1"] = g["C_RET_1Q"].shift(1)
m["LOG_N"] = np.log1p(m.PRICE_SAMPLE_CNT)
m["N_CHG_4Q"] = m.LOG_N - g["PRICE_SAMPLE_CNT"].shift(4).pipe(np.log1p)
m["QTR"] = m.YQ.str[-1].astype(int)
t = t.merge(m[["LDONG_CD", "SGG_CD"]].drop_duplicates(), on="LDONG_CD")
t["AGE"] = t.YQ.str[:4].astype(int) - t.BUILD_YEAR_NUM
comp = t.groupby(["LDONG_CD", "QI"]).agg(AGE_MED=("AGE", "median"), AREA_MED=("EXCL_AREA_NUM", "median"))
m = m.merge(comp.reset_index(), on=["LDONG_CD", "QI"], how="left")

# 구·서울 단위 같은 단지 변화율
cs = c.merge(m[["LDONG_CD", "SGG_CD"]].drop_duplicates(), on="LDONG_CD")
for lag, nm in [(1, "1Q"), (4, "4Q")]:
    j = cs.merge(cs.assign(QI=cs.QI + lag), on=["LDONG_CD", "APT_KEY", "QI", "SGG_CD"], suffixes=("", "_P"))
    j["W"] = np.minimum(j.N, j.N_P)
    j["WD"] = j.W * (j.LU - j.LU_P)
    sg = j.groupby(["SGG_CD", "QI"])[["WD", "W"]].sum()
    se = j.groupby("QI")[["WD", "W"]].sum()
    m = m.merge((sg.WD / sg.W).rename(f"SGG_C_RET_{nm}").reset_index(), on=["SGG_CD", "QI"], how="left")
    m = m.merge((se.WD / se.W).rename(f"SEOUL_C_RET_{nm}").reset_index(), on="QI", how="left")
sgg_lp = np.log(t.groupby(["SGG_CD", "QI"]).UNIT_AMT.median()).rename("SGG_LP").reset_index()
m = m.merge(sgg_lp, on=["SGG_CD", "QI"], how="left")
m["REL_SGG"] = m.LP - m.SGG_LP
m = m.sort_values(["LDONG_CD", "QI"]).reset_index(drop=True)
g = m.groupby("LDONG_CD")
m.loc[m.LP.isna(), ["AGE_MED", "AREA_MED"]] = np.nan
PRICE = ["LP", "RET_1Q", "RET_4Q", "C_RET_1Q", "C_RET_4Q", "C_RET_1Q_L1", "LOG_N", "N_CHG_4Q", "QTR",
         "AGE_MED", "AREA_MED", "REL_SGG", "SGG_C_RET_1Q", "SGG_C_RET_4Q", "SEOUL_C_RET_1Q", "SEOUL_C_RET_4Q"]

# ── 상권 피처 ──
LCNS = []
for grp in GROUPS:
    a = np.log1p(m[f"{grp}_ACTIVE_CNT"])
    m[f"{grp}_ACT"] = a
    m[f"{grp}_GR_1Q"] = a - g[f"{grp}_ACTIVE_CNT"].shift(1).pipe(np.log1p)
    m[f"{grp}_GR_4Q"] = a - g[f"{grp}_ACTIVE_CNT"].shift(4).pipe(np.log1p)
    o4 = g[f"{grp}_OPEN_CNT"].transform(lambda s: s.rolling(4).sum())
    cl4 = g[f"{grp}_CLOSE_CNT"].transform(lambda s: s.rolling(4).sum())
    m[f"{grp}_OPEN_R4"] = o4 / (m[f"{grp}_ACTIVE_CNT"] + 1)
    m[f"{grp}_CLOSE_R4"] = cl4 / (m[f"{grp}_ACTIVE_CNT"] + 1)
    LCNS += [f"{grp}_{s}" for s in ("ACT", "GR_1Q", "GR_4Q", "OPEN_R4", "CLOSE_R4")]
tot = m[[f"{grp}_ACTIVE_CNT" for grp in GROUPS]].sum(axis=1)
m["ALL_ACT"] = np.log1p(tot)
m["ALL_GR_4Q"] = m.ALL_ACT - np.log1p(tot.groupby(m.LDONG_CD).shift(4))
LCNS += ["ALL_ACT", "ALL_GR_4Q"]

EXCESS = len(sys.argv) > 3 and sys.argv[3] == "excess"
if EXCESS:   # 같은 기간 서울 전체 단지 기준 변화율을 뺀 초과 변화율
    mk = "SEOUL_C_RET_1Q" if H == 1 else "SEOUL_C_RET_4Q"
    m["TARGET"] = m["TARGET"] - g[mk].shift(-H)
# ── 행 선택·분할 ──
d = m[m.TARGET.notna() & (m.TARGET_YQ <= LAST)].copy()
d["SPLIT"] = np.select([d.TARGET_YQ <= TRAIN_END, d.TARGET_YQ <= VALID_END], ["train", "valid"], "test")
print("rows", d.SPLIT.value_counts().to_dict(), "dongs", d.LDONG_CD.nunique())
print("target std (%%): same-complex %.2f" % (d.TARGET.std() * 100))

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


def err(s, col):
    return np.abs(np.exp(s[col] - s.TARGET) - 1)   # |예측가/실제가 - 1| (같은 단지 기준)


def metrics(s, col):
    mape = err(s, col).mean() * 100
    nz = s.TARGET != 0
    direction = (np.sign(s[col][nz]) == np.sign(s.TARGET[nz])).mean() * 100 if col != "P_BASE" else np.nan
    return mape, direction


rows = []
for split in ["valid", "test"]:
    s = d[d.SPLIT == split]
    base = metrics(s, "P_BASE")[0]
    for name, col in [("1 기준선", "P_BASE"), ("2 집값만", "P_PRICE"), ("3 집값+상권", "P_LCNS")]:
        mape, dirc = metrics(s, col)
        rows.append([split, name, len(s), round(mape, 2), round((base - mape) / base * 100, 1), round(dirc, 1)])
print(pd.DataFrame(rows, columns=["split", "model", "rows", "MAPE%", "기준선대비감소%", "방향정확도%"]).to_string(index=False))

s = d[d.SPLIT == "test"].copy()
r = []
for q, x in s.groupby("TARGET_YQ"):
    r.append([q, len(x)] + [round(metrics(x, cc)[0], 2) for cc in ("P_BASE", "P_PRICE", "P_LCNS")])
print(pd.DataFrame(r, columns=["타깃분기", "rows", "기준선", "집값만", "집값+상권"]).to_string(index=False))

imp = pd.Series(mdl_l.feature_importance("gain"), index=PRICE + LCNS)
print("LCNS gain share %.1f%%" % (imp[LCNS].sum() / imp.sum() * 100))
print((imp / imp.sum() * 100).round(1).sort_values(ascending=False).head(10).to_string())

rng = np.random.default_rng(0)
s["E1"], s["E2"], s["E3"] = err(s, "P_BASE"), err(s, "P_PRICE"), err(s, "P_LCNS")
per = s.groupby("LDONG_CD")[["E1", "E2", "E3"]].agg(["sum", "count"])
dongs = per.index.to_numpy()
d32, d21 = [], []
for _ in range(2000):
    pick = per.loc[rng.choice(dongs, len(dongs))]
    n = pick[("E2", "count")].sum()
    d32.append((pick[("E3", "sum")].sum() - pick[("E2", "sum")].sum()) / n * 100)
    d21.append((pick[("E2", "sum")].sum() - pick[("E1", "sum")].sum()) / n * 100)
print("MAPE(2)-MAPE(1) %%p: %.3f, 95%% CI [%.3f, %.3f]" % (np.mean(d21), *np.percentile(d21, [2.5, 97.5])))
print("MAPE(3)-MAPE(2) %%p: %.3f, 95%% CI [%.3f, %.3f]" % (np.mean(d32), *np.percentile(d32, [2.5, 97.5])))

# 순위 상관 (분기별 단면: 어떤 동이 더 오를지 순서를 맞혔는지)
def rank_ic(col):
    v = [x[col].rank().corr(x.TARGET.rank()) for _, x in s.groupby("TARGET_YQ") if len(x) > 20]
    return np.mean(v)
print("rank IC (test, 분기별 평균): 집값만 %.3f, 집값+상권 %.3f" % (rank_ic("P_PRICE"), rank_ic("P_LCNS")))
