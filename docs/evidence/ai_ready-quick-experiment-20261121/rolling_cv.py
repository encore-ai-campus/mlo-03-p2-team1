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
# ── 롤링 검증: 테스트 연도 Y마다 학습(타깃 ≤ Y-2년) / 검증(Y-1년, early stopping) / 테스트(Y년) ──
d = m[m.TARGET.notna() & (m.TARGET_YQ <= LAST)].copy()
d["TY"] = d.TARGET_YQ.str[:4].astype(int)
PARAMS = dict(objective="l2", learning_rate=0.03, num_leaves=15, min_data_in_leaf=40,
              feature_fraction=0.8, bagging_fraction=0.8, bagging_freq=1, lambda_l2=1.0,
              seed=7, deterministic=True, force_col_wise=True, verbose=-1, num_threads=1)


def fit(tr, va, cols):
    mdl = lgb.train(PARAMS, lgb.Dataset(tr[cols], tr.TARGET), 3000,
                    valid_sets=[lgb.Dataset(va[cols], va.TARGET)],
                    callbacks=[lgb.early_stopping(100, verbose=False)])
    return mdl


def err(y, p):
    return np.abs(np.exp(p - y) - 1)


rows, allt = [], []
for Y in range(2021, 2027):
    tr, va, te = d[d.TY <= Y - 2], d[d.TY == Y - 1], d[d.TY == Y].copy()
    mp, ml = fit(tr, va, PRICE), fit(tr, va, PRICE + LCNS)
    te["P1"] = 0.0
    te["P2"] = mp.predict(te[PRICE], num_iteration=mp.best_iteration)
    te["P3"] = ml.predict(te[PRICE + LCNS], num_iteration=ml.best_iteration)
    e = {k: err(te.TARGET, te[k]).mean() * 100 for k in ("P1", "P2", "P3")}
    nz = te.TARGET != 0
    dirc = {k: (np.sign(te[k][nz]) == np.sign(te.TARGET[nz])).mean() * 100 for k in ("P2", "P3")}
    ic = {k: np.mean([x[k].rank().corr(x.TARGET.rank()) for _, x in te.groupby("TARGET_YQ")]) for k in ("P2", "P3")}
    rows.append([Y, len(tr), len(te), mp.best_iteration, ml.best_iteration,
                 round(e["P1"], 2), round(e["P2"], 2), round(e["P3"], 2),
                 round((e["P1"] - e["P2"]) / e["P1"] * 100, 1), round(e["P3"] - e["P2"], 3),
                 round(dirc["P2"], 1), round(dirc["P3"], 1), round(ic["P2"], 3), round(ic["P3"], 3)])
    te["FOLD"] = Y
    allt.append(te)
cols = ["테스트연도", "학습행", "테스트행", "iter2", "iter3", "기준선", "집값만", "집값+상권",
        "집값만_기준선대비감소%", "상권효과%p(3-2)", "방향2", "방향3", "IC2", "IC3"]
r = pd.DataFrame(rows, columns=cols)
pd.set_option("display.width", 250)
print(r.to_string(index=False))
print("상권 효과가 음수(개선)인 연도: %d/%d,  IC 개선 연도: %d/%d" % (
    (r["상권효과%p(3-2)"] < 0).sum(), len(r), (r.IC3 > r.IC2).sum(), len(r)))
a = pd.concat(allt)
a["E1"], a["E2"], a["E3"] = err(a.TARGET, a.P1), err(a.TARGET, a.P2), err(a.TARGET, a.P3)
print("전체 평균 MAPE: 기준선 %.2f, 집값만 %.2f, 집값+상권 %.2f" % tuple(a[k].mean() * 100 for k in ("E1", "E2", "E3")))
rng = np.random.default_rng(0)
per = a.groupby("LDONG_CD")[["E1", "E2", "E3"]].agg(["sum", "count"])
dongs = per.index.to_numpy()
d21, d32 = [], []
for _ in range(2000):
    pk = per.loc[rng.choice(dongs, len(dongs))]
    n = pk[("E2", "count")].sum()
    d21.append((pk[("E2", "sum")].sum() - pk[("E1", "sum")].sum()) / n * 100)
    d32.append((pk[("E3", "sum")].sum() - pk[("E2", "sum")].sum()) / n * 100)
print("집값만-기준선 %%p: %.3f [%.3f, %.3f]" % (np.mean(d21), *np.percentile(d21, [2.5, 97.5])))
print("상권효과(3-2) %%p: %.3f [%.3f, %.3f]" % (np.mean(d32), *np.percentile(d32, [2.5, 97.5])))
