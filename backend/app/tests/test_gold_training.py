import json
from shutil import copytree

import pytest


def test_gold_and_training_use_quarter_boundaries_and_nullable_silver(tmp_path):
    pd = pytest.importorskip("pandas")
    pytest.importorskip("pyarrow")
    pytest.importorskip("sklearn")
    from backend.app.pipeline import feed, gold, training

    copytree(feed.ROOT / "metadata", tmp_path / "metadata")
    params = tmp_path / "metadata" / "cln_param.csv"
    params.write_text(
        "param,dataset,value\nANLS_BGN_DT,*,2020-01-01\nANLS_END_DT,*,2022-06-30\n",
        encoding="utf-8",
    )
    inputs = {dataset: tmp_path / f"{dataset}.parquet" for dataset in gold.DATASETS}
    pd.DataFrame([{
        "LDONG_CD": "1144010100", "LDONG_NM": "아현동", "SIDO_CD": "11",
        "SIDO_NM": "서울", "SGG_CD": "11440", "SGG_NM": "마포구",
        "UMD_NM": "아현동", "LDONG_SE_CD": "읍면동", "ABL_YN": False,
    }]).to_parquet(inputs["ldong_code"])
    base = {
        "LDONG_CD": "1144010100", "SGG_CD": "11440", "APT_KEY": "a",
        "DEAL_AMT_NUM": 100_000_000, "EXCL_AREA_NUM": 100.0, "FLR_NUM": 3,
        "APT_DONG_TXT": "101", "CNCL_YN": None, "SAME_DEAL_YN": None,
        "SRC_FILE_NM": "a.xml", "SRC_ROW_NUM": 1,
    }
    periods = pd.period_range("2020Q1", "2022Q2", freq="Q")
    prices = [100, 100, 100, 100, 116, 96, 119, 91, 124, 104]
    trades = [
        dict(base, DEAL_DTM=period.start_time, DEAL_AMT_NUM=prices[i] * 1_000_000, SRC_ROW_NUM=i + 1)
        for i, period in enumerate(periods)
    ]
    trades[0]["SAME_DEAL_YN"] = True
    trades.extend([
        dict(trades[0], SRC_FILE_NM="b.xml", SRC_ROW_NUM=11),
        dict(trades[0], CNCL_YN=True, SRC_ROW_NUM=12),
        dict(trades[0], SGG_CD="26110", SRC_ROW_NUM=13),
        dict(base, DEAL_DTM=periods[0].start_time, SRC_ROW_NUM=14, EXCL_AREA_NUM=0),
    ])
    pd.DataFrame(trades).to_parquet(inputs["apt_trade"])

    for dataset, codes in gold.LICENSE_CODES.items():
        records = [{
            "LDONG_CD": "1144010100", "LDONG_SRC_CD": "원본코드", "LGOV_CD": "3130000",
            "OUT_SEOUL_ADDR_YN": None, "ANLS_INDUTY_CD": codes[0],
            "ANLS_LCNS_DTM": pd.Timestamp("2019-01-01"), "ANLS_CLSBIZ_DTM": pd.Timestamp("2020-03-31"),
            "OUT_SCOPE_YN": None, "ABNRM_LCNS_DTM_YN": None, "CLSBIZ_SRC_CD": "최종수정일자_대용",
        }]
        if dataset == "clinic":
            records.append(dict(
                records[0], ANLS_LCNS_DTM=pd.Timestamp("2020-03-31"), ANLS_CLSBIZ_DTM=pd.NaT,
                ABNRM_LCNS_DTM_YN=True, CLSBIZ_SRC_CD="해당없음",
            ))
        pd.DataFrame(records).to_parquet(inputs[dataset])

    location = gold.run(tmp_path, inputs)
    mart = pd.read_parquet(location / "mart_ldong_infra_qtr.parquet").set_index("yq")
    first = mart.loc["2020Q1"]
    assert (first.trade_count, first.priced_count, first.price_per_sqm_won) == (2, 1, 1_000_000.0)
    assert mart.loc["2021Q1", "actual_growth_pct"] == pytest.approx(16)
    metrics = {metric["industry_code"]: metric for metric in json.loads(first.license_metrics)}
    assert (metrics["약국"]["close_count"], metrics["약국"]["active_count"], metrics["약국"]["proxy_close_count"]) == (1, 0, 1)
    assert (metrics["의원"]["open_count"], metrics["의원"]["active_count"]) == (0, 1)
    assert metrics["편의점"]["reference_only"]

    training.run(location, tmp_path / "report")
    predictions = pd.read_parquet(location / "fact_apt_prediction.parquet")
    assert list(predictions["yq"]) == ["2022Q2", "2022Q3"]
    assert list(predictions["model_fit_through"]) == ["2022Q1", "2022Q2"]
    assert list(predictions["prediction_kind"]) == ["holdout", "forecast"]
    assert predictions["rise_probability"].between(0, 1).all()
