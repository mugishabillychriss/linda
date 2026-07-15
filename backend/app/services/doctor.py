"""
AI Dataset Doctor -- turns the statistical profile into a plain-language
diagnosis + recommended fixes. Uses Groq's free-tier API (OpenAI-compatible),
so no paid Anthropic/OpenAI key is required.

Env var required:
  GROQ_API_KEY -> set in Render > Service > Environment.
                  Get a free key at https://console.groq.com/keys
                  (no credit card required for the free tier).

Model: llama-3.3-70b-versatile is Groq's current free-tier general model as
of writing. If Groq deprecates/renames it, check https://console.groq.com/docs/models
and update GROQ_MODEL below (or set the GROQ_MODEL env var to override
without a code change).

Important: the LLM only EXPLAINS and RECOMMENDS. It never touches the
data directly -- app/services/cleaner.py performs all real transformations,
and only after the user approves.
"""

import json
import os
from typing import Optional

# Note: Groq exposes an OpenAI-compatible endpoint. We delay importing and
# initializing the OpenAI client until it's actually needed so that simple
# import-time checks (like CI smoke tests) don't fail when the API key isn't
# present.

GROQ_MODEL = os.environ.get("GROQ_MODEL", "llama-3.3-70b-versatile")

SYSTEM_PROMPT = """You are the AI Dataset Doctor inside Doctor Linda, an AI \
data-preparation platform. Given a JSON statistical profile of a dataset, \
produce a plain-language diagnosis for a non-technical-ish but data-literate \
user. Respond ONLY with JSON matching this schema, no prose outside it, no \
markdown code fences:

{
  "quality_score": number,
  "summary": string,
  "problems": [
    {"issue": string, "why_it_matters": string, "recommended_fix": string, "operation_id": string}
  ],
  "estimated_quality_after_cleaning": number
}

operation_id must be one of: remove_duplicate_rows, remove_empty_rows, \
fill_missing_values, normalize_text_case, trim_whitespace, \
standardize_dates, validate_numeric_columns, validate_email_addresses
"""


def _create_client():
    """Create and return an OpenAI-compatible client or None if the API key
    is not configured.

    This function intentionally imports the OpenAI client only when needed so
    that importing this module doesn't require network credentials.
    """
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None

    # Import locally to avoid import-time side-effects when the key is absent.
    from openai import OpenAI

    return OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")


def diagnose(profile: dict) -> dict:
    """Generate a JSON diagnosis for the provided statistical profile.

    If the GROQ_API_KEY environment variable is not set, raise a clear
    RuntimeError so callers can handle the absence of the LLM gracefully.
    """
    client = _create_client()
    if client is None:
        raise RuntimeError(
            "GROQ_API_KEY is not set. The dataset diagnosis requires a Groq/OpenAI API key. "
            "Set the GROQ_API_KEY environment variable or configure a client before calling diagnose()."
        )

    response = client.chat.completions.create(
        model=GROQ_MODEL,
        max_tokens=1500,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": json.dumps(profile)},
        ],
        response_format={"type": "json_object"},
    )
    text = response.choices[0].message.content
    text = text.strip().removeprefix("```json").removesuffix("```").strip()
    return json.loads(text)
