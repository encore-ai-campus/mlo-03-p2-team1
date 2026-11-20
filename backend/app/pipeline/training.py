import json
from pathlib import Path

import pandas as pd
from sklearn.metrics import accuracy_score
from sklearn.tree import DecisionTreeClassifier

MODEL_VERSION = "decision-tree-rise-v1"
FEATURES = ["price_per_sqm_won", "actual_growth_pct", "trade_count"]
COLUMNS = {
    "ldong_cd": "string", "yq": "string", "predicted_rise": "bool",
    "rise_probability": "float64", "model_version": "string",
    "model_fit_through": "string", "prediction_kind": "string",
}


def predict(model, rows, through, kind):
    return rows[["ldong_cd", "target_yq"]].rename(columns={"target_yq": "yq"}).assign(
        predicted_rise=model.predict(rows[FEATURES]).astype(bool),
        rise_probability=model.predict_proba(rows[FEATURES])[:, 1],
        model_version=MODEL_VERSION, model_fit_through=through, prediction_kind=kind,
    )


def fit(market: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    observed = market.loc[market["price_per_sqm_won"].notna()]
    available = observed.dropna(subset=FEATURES)
    features = available.assign(target_yq=(pd.PeriodIndex(available["yq"], freq="Q") + 1).astype(str))
    labels = available[["ldong_cd", "yq", "actual_growth_pct"]].rename(
        columns={"yq": "target_yq", "actual_growth_pct": "target_growth_pct"}
    )
    samples = features.merge(labels, on=["ldong_cd", "target_yq"], validate="one_to_one")
    samples["rises"] = samples["target_growth_pct"].gt(0).astype(int)
    outputs = []
    summary = {"model_version": MODEL_VERSION, "status": "insufficient_history", "validation_accuracy": None}

    if not observed.empty:
        last_observed = observed["yq"].max()
        train = samples.loc[samples["target_yq"].lt(last_observed)]
        valid = samples.loc[samples["target_yq"].eq(last_observed)]
        if not valid.empty and train["rises"].nunique() == 2:
            tree = DecisionTreeClassifier(criterion="entropy", max_depth=3, random_state=0)
            tree.fit(train[FEATURES], train["rises"])
            holdout = predict(tree, valid, train["target_yq"].max(), "holdout")
            outputs.append(holdout)
            future = features.loc[features["yq"].eq(last_observed)]
            tree.fit(samples[FEATURES], samples["rises"])
            outputs.append(predict(tree, future, last_observed, "forecast"))
            summary.update(
                status="trained", training_rows=len(train), holdout_rows=len(valid), holdout_yq=last_observed,
                validation_accuracy=float(accuracy_score(valid["rises"], holdout["predicted_rise"])),
            )

    predictions = pd.concat(outputs, ignore_index=True) if outputs else pd.DataFrame(columns=list(COLUMNS))
    return predictions.astype(COLUMNS).sort_values(["yq", "ldong_cd"]), summary


def write_report(report: Path, summary: dict, *, source: str) -> None:
    report.mkdir(parents=True, exist_ok=True)
    result = {"input": source, **summary}
    (report / "apt_training.json").write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")


def run(gold: Path, report: Path) -> bool:
    market = pd.read_parquet(gold / "mart_ldong_infra_qtr.parquet", columns=["ldong_cd", "yq", *FEATURES])
    predictions, summary = fit(market)
    predictions.to_parquet(gold / "fact_apt_prediction.parquet", index=False)
    write_report(report, summary, source="parquet")
    return summary["status"] == "trained"
