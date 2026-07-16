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


def jsonable_value(val):
    """Converts a raw cell value into something JSON can actually encode --
    pandas/numpy NaN serializes as the bare token NaN, which is not valid
    JSON and breaks JS's JSON.parse() on the frontend (and Starlette's own
    JSONResponse rejects it outright), so it becomes None instead. Numpy
    scalar types are converted to native Python types."""
    if pd.isna(val):
        return None
    if hasattr(val, "item"):
        return val.item()
    return val


def preview_operations(
    df: pd.DataFrame, operation_ids: list[str], options: dict | None = None, sample_size: int = 15
) -> list[dict]:
    """Runs each operation individually against the ORIGINAL dataframe (never
    mutating it) and returns a sample of before/after cell-level changes, so
    the user can see exactly what each operation would do before approving
    it. This is what the dashboard's preview/approve step calls -- actually
    applying changes only happens in apply_operations, and only for
    operations the user has approved."""
    options = options or {}
    changes = []

    for op_id in operation_ids:
        fn = OPERATIONS.get(op_id)
        if not fn:
            continue
        before = df.copy()
        after = fn(before.copy(), **options.get(op_id, {}))

        # Row-count-changing operations (dedupe, drop-empty) are shown as a
        # single summary change rather than a per-cell diff, since "row 47
        # removed" isn't a before/after cell pair.
        if len(after) != len(before):
            changes.append(
                {
                    "operation_id": op_id,
                    "type": "row_count_change",
                    "before_rows": int(len(before)),
                    "after_rows": int(len(after)),
                }
            )
            continue

        common_cols = [c for c in before.columns if c in after.columns]
        new_cols = [c for c in after.columns if c not in before.columns]
        sample_added = 0

        for col in new_cols:
            if sample_added >= sample_size:
                break
            changes.append(
                {
                    "operation_id": op_id,
                    "type": "column_added",
                    "column": col,
                    "sample_values": [jsonable_value(v) for v in after[col].head(3).tolist()],
                }
            )
            sample_added += 1

        for col in common_cols:
            if sample_added >= sample_size:
                break
            b_series = before[col]
            a_series = after[col]
            # NaN != NaN is always True in pandas/numpy, so without this,
            # every untouched row containing a missing value would be
            # falsely reported as "changed" by every operation.
            both_na = b_series.isna() & a_series.isna()
            diff_mask = ~both_na & (b_series.astype(str) != a_series.astype(str))
            diff_idx = before.index[diff_mask]
            for idx in diff_idx[: sample_size - sample_added]:
                changes.append(
                    {
                        "operation_id": op_id,
                        "type": "cell_change",
                        "row": int(idx),
                        "column": col,
                        "before": jsonable_value(before.at[idx, col]),
                        "after": jsonable_value(after.at[idx, col]),
                    }
                )
                sample_added += 1
                if sample_added >= sample_size:
                    break

    return changes
