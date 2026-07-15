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

from openai import OpenAI  # Groq exposes an OpenAI-compatible endpoint

client = OpenAI(
    api_key=os.environ.get("GROQ_API_KEY"),
    base_url="https://api.groq.com/openai/v1",
)

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


def diagnose(profile: dict) -> dict:
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
