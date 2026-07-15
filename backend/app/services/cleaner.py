"""
Cleaning engine: the ONLY code path allowed to transform data.
Every function takes a DataFrame and returns a NEW DataFrame -- the
original is never mutated, per Doctor Linda's "original dataset is never
modified" principle.
"""

import pandas as pd
import re

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def remove_duplicate_rows(df: pd.DataFrame, **_) -> pd.DataFrame:
    return df.drop_duplicates().reset_index(drop=True)


def remove_empty_rows(df: pd.DataFrame, **_) -> pd.DataFrame:
    return df.dropna(how="all").reset_index(drop=True)


def fill_missing_values(df: pd.DataFrame, strategy: str = "auto", **_) -> pd.DataFrame:
    out = df.copy()
    for col in out.columns:
        if out[col].isna().any():
            if pd.api.types.is_numeric_dtype(out[col]):
                out[col] = out[col].fillna(out[col].median())
            else:
                mode = out[col].mode()
                out[col] = out[col].fillna(mode.iloc[0] if not mode.empty else "unknown")
    return out


def normalize_text_case(df: pd.DataFrame, columns=None, case: str = "lower", **_) -> pd.DataFrame:
    out = df.copy()
    cols = columns or out.select_dtypes(include="object").columns
    for col in cols:
        out[col] = out[col].astype(str).str.lower() if case == "lower" else out[col].astype(str).str.upper()
    return out


def trim_whitespace(df: pd.DataFrame, **_) -> pd.DataFrame:
    out = df.copy()
    for col in out.select_dtypes(include="object").columns:
        out[col] = out[col].astype(str).str.strip()
    return out


def standardize_dates(df: pd.DataFrame, columns=None, fmt: str = "%Y-%m-%d", **_) -> pd.DataFrame:
    out = df.copy()
    cols = columns or []
    for col in cols:
        out[col] = pd.to_datetime(out[col], errors="coerce").dt.strftime(fmt)
    return out


def validate_numeric_columns(df: pd.DataFrame, columns=None, **_) -> pd.DataFrame:
    out = df.copy()
    cols = columns or []
    for col in cols:
        out[col] = pd.to_numeric(out[col], errors="coerce")
    return out


def validate_email_addresses(df: pd.DataFrame, columns=None, **_) -> pd.DataFrame:
    out = df.copy()
    cols = columns or []
    for col in cols:
        out[f"{col}_valid"] = out[col].astype(str).str.match(EMAIL_RE)
    return out


OPERATIONS = {
    "remove_duplicate_rows": remove_duplicate_rows,
    "remove_empty_rows": remove_empty_rows,
    "fill_missing_values": fill_missing_values,
    "normalize_text_case": normalize_text_case,
    "trim_whitespace": trim_whitespace,
    "standardize_dates": standardize_dates,
    "validate_numeric_columns": validate_numeric_columns,
    "validate_email_addresses": validate_email_addresses,
}


def apply_operations(df: pd.DataFrame, operation_ids: list[str], options: dict | None = None) -> pd.DataFrame:
    """Applies a sequence of approved operations in order, returning a new DataFrame."""
    options = options or {}
    out = df.copy()
    for op_id in operation_ids:
        fn = OPERATIONS.get(op_id)
        if not fn:
            raise ValueError(f"Unknown operation: {op_id}")
        out = fn(out, **options.get(op_id, {}))
    return out
