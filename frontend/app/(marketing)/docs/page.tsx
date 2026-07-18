import MarketingNav from "../../../components/MarketingNav";
import MarketingFooter from "../../../components/MarketingFooter";
import CodeBlock from "../../../components/ui/CodeBlock";
import Card from "../../../components/ui/Card";

const endpoints = [
  {
    method: "POST",
    path: "/datasets/upload",
    description: "Upload a CSV, XLSX, or JSON file. Returns a dataset_id and initial profile.",
    example: `curl -X POST https://api.doctorlinda.app/datasets/upload \\
  -H "Authorization: Bearer $TOKEN" \\
  -F "file=@customers.csv"`,
    response: `{
  "dataset_id": "f7b342bf-578e-4f31-923d-52977a978b1b",
  "profile": {
    "row_count": 1204,
    "column_count": 6,
    "quality_score": 78.2,
    "issues": [ ... ]
  }
}`,
  },
  {
    method: "GET",
    path: "/datasets",
    description: "List all datasets you've uploaded, most recent first.",
    example: `curl https://api.doctorlinda.app/datasets \\
  -H "Authorization: Bearer $TOKEN"`,
    response: `[
  {
    "id": "f7b342bf-...",
    "display_name": "customers.csv",
    "row_count": 1204,
    "quality_score": 78.2
  }
]`,
  },
  {
    method: "GET",
    path: "/datasets/{id}/diagnose",
    description:
      "Run the AI Dataset Doctor against a dataset. Returns a quality score, plain-language summary, smart insights, and a list of issues with recommended fixes.",
    example: `curl https://api.doctorlinda.app/datasets/f7b342bf.../diagnose \\
  -H "Authorization: Bearer $TOKEN"`,
    response: `{
  "quality_score": 78.2,
  "summary": "...",
  "insights": ["..."],
  "problems": [
    {
      "issue": "Invalid email addresses",
      "severity": "high",
      "column": "email",
      "operation_id": "validate_email_addresses"
    }
  ],
  "estimated_quality_after_cleaning": 96.1
}`,
  },
  {
    method: "POST",
    path: "/datasets/preview",
    description:
      "Preview what a set of cleaning operations would change, without applying them.",
    example: `curl -X POST https://api.doctorlinda.app/datasets/preview \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "f7b342bf-...",
    "operation_ids": ["trim_whitespace", "fill_missing_values"]
  }'`,
    response: `{
  "changes": [
    { "operation_id": "trim_whitespace", "column": "email", "before": " x ", "after": "x" }
  ]
}`,
  },
  {
    method: "POST",
    path: "/datasets/clean",
    description:
      "Apply approved cleaning operations. Returns a before/after quality report and the cleaned file's storage path.",
    example: `curl -X POST https://api.doctorlinda.app/datasets/clean \\
  -H "Authorization: Bearer $TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "dataset_id": "f7b342bf-...",
    "operation_ids": ["trim_whitespace", "fill_missing_values"],
    "columns": { "validate_email_addresses": ["email"] }
  }'`,
    response: `{
  "dataset_id": "f7b342bf-...",
  "report": {
    "quality_score_before": 78.2,
    "quality_score_after": 96.1
  }
}`,
  },
  {
    method: "GET",
    path: "/datasets/{id}/download",
    description: "Get a temporary signed URL to download the raw or cleaned file.",
    example: `curl https://api.doctorlinda.app/datasets/f7b342bf.../download?kind=cleaned \\
  -H "Authorization: Bearer $TOKEN"`,
    response: `{ "url": "https://...supabase.co/storage/v1/object/sign/..." }`,
  },
  {
    method: "PATCH / DELETE",
    path: "/datasets/{id}",
    description: "Rename or delete a dataset.",
    example: `curl -X DELETE https://api.doctorlinda.app/datasets/f7b342bf... \\
  -H "Authorization: Bearer $TOKEN"`,
    response: `{ "deleted": true }`,
  },
];

export default function DocsPage() {
  return (
    <main>
      <MarketingNav />

      <section className="max-w-4xl mx-auto px-6 pt-16 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-signal mb-4">
          API Reference
        </p>
        <h1 className="font-display text-4xl font-semibold mb-4">
          Build on Doctor Linda directly
        </h1>
        <p className="text-slate text-lg max-w-2xl">
          Every endpoint the dashboard uses is available over a plain REST API, so you can
          run diagnosis and cleaning as part of your own pipeline.
        </p>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-8">
        <Card className="p-6">
          <h2 className="font-display text-lg font-semibold mb-3">Authentication</h2>
          <p className="text-slate text-sm mb-4">
            Every request needs a Supabase session token as a Bearer header. Get one client-side
            with:
          </p>
          <CodeBlock
            language="javascript"
            code={`const { data: { session } } = await supabase.auth.getSession();
const token = session?.access_token;`}
          />
        </Card>
      </section>

      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="space-y-10">
          {endpoints.map((ep) => (
            <div key={ep.path + ep.method} className="border-t border-ink/10 pt-8">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-mono text-xs px-2 py-1 rounded bg-signal/10 text-signal">
                  {ep.method}
                </span>
                <span className="font-mono text-sm">{ep.path}</span>
              </div>
              <p className="text-slate text-sm mb-4">{ep.description}</p>
              <div className="grid md:grid-cols-2 gap-4">
                <CodeBlock code={ep.example} language="bash" />
                <CodeBlock code={ep.response} language="json" />
              </div>
            </div>
          ))}
        </div>
      </section>

      <MarketingFooter />
    </main>
  );
}
