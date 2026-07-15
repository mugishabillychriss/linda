"""
Dataset profiling: the statistical layer behind the 'AI Dataset Doctor' feature.

This module NEVER modifies the original file. It only reads it and returns
a JSON-serializable report. The report is what gets handed to the LLM
(see app/services/doctor.py) to generate the human-readable diagnosis.
"""

import pandas as pd
import numpy as np


def load_dataframe(path: str) -> pd.DataFrame:
    if path.endswith(".csv"):
        return pd.read_csv(path)
    if path.endswith(".xlsx"):
        return pd.read_excel(path)
    if path.endswith(".json"):
        return pd.read_json(path)
    raise ValueError(f"Unsupported file type: {path}")


def profile_dataset(df: pd.DataFrame) -> dict:
    n_rows, n_cols = df.shape

    missing = df.isna().sum()
    missing_pct = (missing / max(n_rows, 1) * 100).round(2)

    dup_rows = int(df.duplicated().sum())
    dup_cols = int(df.T.duplicated().sum())

    dtypes = df.dtypes.astype(str).to_dict()

    numeric_cols = df.select_dtypes(include=[np.number]).columns
    stats = df[numeric_cols].describe().to_dict() if len(numeric_cols) else {}

    issues = []
    for col in df.columns:
        if missing_pct[col] > 0:
            issues.append(
                {
                    "type": "missing_values",
                    "column": col,
                    "detail": f"{missing[col]} missing ({missing_pct[col]}%)",
                }
            )
    if dup_rows:
        issues.append({"type": "duplicate_rows", "column": None, "detail": f"{dup_rows} duplicate rows"})
    if dup_cols:
        issues.append({"type": "duplicate_columns", "column": None, "detail": f"{dup_cols} duplicate columns"})

    quality_score = max(0, 100 - len(issues) * 5 - (dup_rows / max(n_rows, 1)) * 20)

    return {
        "row_count": n_rows,
        "column_count": n_cols,
        "dtypes": dtypes,
        "missing_values": missing.to_dict(),
        "missing_pct": missing_pct.to_dict(),
        "duplicate_rows": dup_rows,
        "duplicate_columns": dup_cols,
        "memory_usage_bytes": int(df.memory_usage(deep=True).sum()),
        "numeric_stats": stats,
        "issues": issues,
        "quality_score": round(quality_score, 1),
    }
