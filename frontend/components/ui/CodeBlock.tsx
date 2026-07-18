"use client";

import { useState } from "react";

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "bash" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-lg overflow-hidden border border-ink/10 bg-[#0d1117] dark:bg-black/40">
      <div className="flex justify-between items-center px-4 py-2 border-b border-white/10">
        <span className="font-mono text-[10px] uppercase tracking-wide text-white/40">
          {language}
        </span>
        <button
          onClick={handleCopy}
          className="font-mono text-[10px] uppercase tracking-wide text-white/40 hover:text-white/80 transition-colors"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="p-4 overflow-x-auto">
        <code className="font-mono text-xs text-white/90 leading-relaxed">{code}</code>
      </pre>
    </div>
  );
}
