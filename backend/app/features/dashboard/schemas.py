from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class DashboardModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class LicenseMetric(DashboardModel):
    industry_code: str
    reference_only: bool
    active_count: int
    open_count: int
    close_count: int
    proxy_close_count: int


class Region(DashboardModel):
    region_code: str
    region_name: str
    district_code: str
    district_name: str | None
    provisional: bool | None
    trade_count: int | None
    priced_count: int | None
    price_per_sqm_won: float | None
    actual_growth_pct: float | None
    predicted_rise: bool | None
    rise_probability: float | None
    model_version: str | None
    model_fit_through: str | None
    prediction_kind: str | None
    license_metrics: list[LicenseMetric]


class Regions(DashboardModel):
    year: int
    quarter: int
    regions: list[Region]


class Quarter(DashboardModel):
    year: int
    quarter: int
    has_observations: bool
    has_market_prices: bool
    has_predictions: bool
