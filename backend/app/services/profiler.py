"""
Dataset profiling: the statistical layer behind the 'AI Dataset Doctor' feature.

This module NEVER modifies the original file. It only reads it and returns
a JSON-serializable report. The report is what gets handed to the LLM
(see app/services/doctor.py) to generate the human-readable diagnosis.
"""

import re
import pandas as pd
import numpy as np

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
URL_RE = re.compile(r"^https?://[^\s]+$")
PHONE_RE = re.compile(r"^\+?[\d\s\-\(\)]{7,15}$")


def load_dataframe(path: str) -> pd.DataFrame:
    if path.endswith(".csv"):
        return pd.read_csv(path)
    if path.endswith(".xlsx"):
        return pd.read_excel(path)
    if path.endswith(".json"):
        return pd.read_json(path)
    raise ValueError(f"Unsupported file type: {path}")


def _detect_pattern(series: pd.Series, col_name: str) -> str | None:
    """Guess what kind of data a text column holds, so we know which
    validation to run. Column name is a much stronger signal than sampling
    values, since a column full of invalid emails still IS an email column --
    sampling alone would miss it precisely when it matters most."""
    name = col_name.lower()
    if "email" in name or "mail" in name:
        return "email"
    if "phone" in name or "tel" in name or "mobile" in name:
        return "phone"
    if "url" in name or "link" in name or "website" in name:
        return "url"

    sample = series.dropna().astype(str).head(50)
    if sample.empty:
        return None
    if (sample.str.match(EMAIL_RE)).mean() > 0.3:
        return "email"
    if (sample.str.match(URL_RE)).mean() > 0.3:
        return "url"
    if (sample.str.match(PHONE_RE)).mean() > 0.3:
        return "phone"
    return None


def _is_text_dtype(series: pd.Series) -> bool:
    return series.dtype == object or pd.api.types.is_string_dtype(series)


def _column_profile(series: pd.Series, col: str) -> dict:
    n = len(series)
    missing = int(series.isna().sum())
    non_null = series.dropna()
    empty_strings = (
        int((series.astype(str).str.strip() == "").sum()) if _is_text_dtype(series) else 0
    )
    unique = int(non_null.nunique())
    duplicates = int(non_null.duplicated().sum())

    profile = {
        "column": col,
        "dtype": str(series.dtype),
        "missing": missing,
        "missing_pct": round(missing / max(n, 1) * 100, 2),
        "empty_strings": empty_strings,
        "unique": unique,
        "duplicates": duplicates,
        "pattern": None,
        "invalid_count": 0,
        "invalid_examples": [],
    }

    if pd.api.types.is_numeric_dtype(series) and not pd.api.types.is_bool_dtype(series):
        if len(non_null) > 0:
            q1, q3 = non_null.quantile(0.25), non_null.quantile(0.75)
            iqr = q3 - q1
            lower, upper = q1 - 1.5 * iqr, q3 + 1.5 * iqr
            outliers = non_null[(non_null < lower) | (non_null > upper)]
            profile.update(
                {
                    "min": float(non_null.min()),
                    "max": float(non_null.max()),
                    "mean": round(float(non_null.mean()), 2),
                    "median": float(non_null.median()),
                    "mode": float(non_null.mode().iloc[0]) if not non_null.mode().empty else None,
                    "std": round(float(non_null.std()), 2) if len(non_null) > 1 else 0.0,
                    "outlier_count": int(len(outliers)),
                    "outlier_examples": [float(v) for v in outliers.head(5).tolist()],
                }
            )
    elif not pd.api.types.is_bool_dtype(series):
        pattern = _detect_pattern(non_null, col)
        profile["pattern"] = pattern
        if pattern == "email":
            invalid = non_null[~non_null.astype(str).str.match(EMAIL_RE)]
            profile["invalid_count"] = int(len(invalid))
            profile["invalid_examples"] = invalid.astype(str).head(5).tolist()
        elif pattern == "url":
            invalid = non_null[~non_null.astype(str).str.match(URL_RE)]
            profile["invalid_count"] = int(len(invalid))
            profile["invalid_examples"] = invalid.astype(str).head(5).tolist()
        elif pattern == "phone":
            invalid = non_null[~non_null.astype(str).str.match(PHONE_RE)]
            profile["invalid_count"] = int(len(invalid))
            profile["invalid_examples"] = invalid.astype(str).head(5).tolist()

    return profile


def _severity(pct: float) -> str:
    if pct >= 20:
        return "critical"
    if pct >= 10:
        return "high"
    if pct >= 1:
        return "medium"
    return "low"


def profile_dataset(df: pd.DataFrame) -> dict:
    n_rows, n_cols = df.shape

    column_profiles = [_column_profile(df[col], col) for col in df.columns]

    dup_rows = int(df.duplicated().sum())
    dup_cols = int(df.T.duplicated().sum())

    issues = []
    for cp in column_profiles:
        if cp["missing"] > 0:
            issues.append(
                {
                    "type": "missing_values",
                    "column": cp["column"],
                    "severity": _severity(cp["missing_pct"]),
                    "detail": f"{cp['missing']} missing ({cp['missing_pct']}%)",
                    "affected_rows": cp["missing"],
                }
            )
        if cp.get("outlier_count", 0) > 0:
            issues.append(
                {
                    "type": "outliers",
                    "column": cp["column"],
                    "severity": _severity(cp["outlier_count"] / max(n_rows, 1) * 100),
                    "detail": f"{cp['outlier_count']} outliers detected",
                    "affected_rows": cp["outlier_count"],
                    "examples": cp.get("outlier_examples", []),
                }
            )
        if cp["invalid_count"] > 0:
            issues.append(
                {
                    "type": f"invalid_{cp['pattern']}",
                    "column": cp["column"],
                    "severity": _severity(cp["invalid_count"] / max(n_rows, 1) * 100),
                    "detail": f"{cp['invalid_count']} invalid {cp['pattern']} values",
                    "affected_rows": cp["invalid_count"],
                    "examples": cp["invalid_examples"],
                }
            )
        if cp["empty_strings"] > 0:
            issues.append(
                {
                    "type": "empty_strings",
                    "column": cp["column"],
                    "severity": _severity(cp["empty_strings"] / max(n_rows, 1) * 100),
                    "detail": f"{cp['empty_strings']} empty/whitespace-only values",
                    "affected_rows": cp["empty_strings"],
                }
            )
        if cp["unique"] == 1 and n_rows > 1:
            issues.append(
                {
                    "type": "constant_column",
                    "column": cp["column"],
                    "severity": "low",
                    "detail": "Column has only one distinct value",
                    "affected_rows": n_rows,
                }
            )

    if dup_rows:
        issues.append(
            {
                "type": "duplicate_rows",
                "column": None,
                "severity": _severity(dup_rows / max(n_rows, 1) * 100),
                "detail": f"{dup_rows} duplicate rows",
                "affected_rows": dup_rows,
            }
        )
    if dup_cols:
        issues.append(
            {
                "type": "duplicate_columns",
                "column": None,
                "severity": "medium",
                "detail": f"{dup_cols} duplicate columns",
                "affected_rows": None,
            }
        )

    total_missing = sum(cp["missing"] for cp in column_profiles)
    total_cells = max(n_rows * n_cols, 1)
    total_invalid = sum(cp["invalid_count"] for cp in column_profiles)
    total_dup_values = sum(cp["duplicates"] for cp in column_profiles)

    dimensions = {
        "completeness": round(100 - (total_missing / total_cells * 100), 1),
        "uniqueness": round(100 - (dup_rows / max(n_rows, 1) * 100), 1),
        "validity": round(100 - (total_invalid / total_cells * 100), 1),
        "consistency": round(
            100 - (sum(1 for cp in column_profiles if cp["empty_strings"] > 0) / max(n_cols, 1) * 20), 1
        ),
        "accuracy": round(
            100 - (sum(cp.get("outlier_count", 0) for cp in column_profiles) / total_cells * 100), 1
        ),
        "integrity": round(100 - (dup_cols / max(n_cols, 1) * 100), 1),
        # No timestamp/freshness metadata is available at this stage, so
        # timeliness is left as "not applicable" rather than faked.
        "timeliness": None,
    }
    for k, v in dimensions.items():
        if v is not None:
            dimensions[k] = max(0.0, min(100.0, v))

    computed = [v for v in dimensions.values() if v is not None]
    quality_score = round(sum(computed) / len(computed), 1) if computed else 100.0

    return {
        "row_count": n_rows,
        "column_count": n_cols,
        "column_profiles": column_profiles,
        "duplicate_rows": dup_rows,
        "duplicate_columns": dup_cols,
        "memory_usage_bytes": int(df.memory_usage(deep=True).sum()),
        "issues": issues,
        "dimensions": dimensions,
        "quality_score": quality_score,
    }
