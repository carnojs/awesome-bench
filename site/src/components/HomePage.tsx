import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import type { IndexFile, FrameworkResult } from "../types";

type SortKey =
  | "framework"
  | "language"
  | "plaintext_rps"
  | "plaintext_p95"
  | "json_rps"
  | "json_p95"
  | "measured_at";
type SortDirection = "asc" | "desc";

interface FrameworkData {
  id: string;
  framework: string;
  language: string;
  url?: string;
  plaintext_rps: number;
  plaintext_p95: number;
  json_rps: number;
  json_p95: number;
  measured_at: string;
}

export default function HomePage() {
  const [index, setIndex] = useState<IndexFile | null>(null);
  const [frameworks, setFrameworks] = useState<FrameworkData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("plaintext_rps");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  useEffect(() => {
    async function loadData() {
      try {
        const indexRes = await fetch("./results/index.json");
        if (!indexRes.ok) {
          setError("No benchmark results available yet.");
          setLoading(false);
          return;
        }
        const indexData: IndexFile = await indexRes.json();
        setIndex(indexData);

        const frameworkPromises = indexData.frameworks.map(async (entry) => {
          const res = await fetch(`./${entry.latest}`);
          if (!res.ok) return null;
          const result: FrameworkResult = await res.json();
          return {
            id: entry.id,
            framework: result.framework,
            language: result.language,
            url: result.url,
            plaintext_rps: result.benchmarks.plaintext?.requests_per_sec ?? 0,
            plaintext_p95: result.benchmarks.plaintext?.latency_ms.p95 ?? 0,
            json_rps: result.benchmarks.json?.requests_per_sec ?? 0,
            json_p95: result.benchmarks.json?.latency_ms.p95 ?? 0,
            measured_at: result.measured_at,
          };
        });

        const results = (await Promise.all(frameworkPromises)).filter(
          (r) => r !== null
        ) as FrameworkData[];
        setFrameworks(results);
      } catch {
        setError("Failed to load benchmark data.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sortedFrameworks = useMemo(() => {
    return [...frameworks].sort((a, b) => {
      let aVal: string | number = a[sortKey];
      let bVal: string | number = b[sortKey];

      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = (bVal as string).toLowerCase();
      }

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [frameworks, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection(key.includes("rps") ? "desc" : "asc");
    }
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toFixed(0);
  };

  const formatLatency = (ms: number): string => {
    if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
    return `${ms.toFixed(2)}ms`;
  };

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const SortIcon = ({ active, direction }: { active: boolean; direction: SortDirection }) => (
    <span className={`ml-1 ${active ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}`}>
      {direction === "asc" ? "↑" : "↓"}
    </span>
  );

  const TableHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <th
      className="px-4 py-3 text-left text-sm font-semibold cursor-pointer hover:bg-[var(--bg-secondary)] transition-colors"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center">
        {label}
        <SortIcon active={sortKey === sortKeyName} direction={sortDirection} />
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-[var(--accent)] border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--bg-secondary)] mb-4">
          <svg className="w-8 h-8 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">No Results Yet</h2>
        <p className="text-[var(--text-secondary)] max-w-md mx-auto">
          {error} Benchmarks run automatically when frameworks are added or updated.
        </p>
      </div>
    );
  }

  const maxPlaintextRps = Math.max(...frameworks.map((f) => f.plaintext_rps));
  const maxJsonRps = Math.max(...frameworks.map((f) => f.json_rps));

  return (
    <div>
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
          HTTP Framework Benchmarks
        </h1>
        <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
          Standardized benchmarks comparing web frameworks across different languages.
          All tests run with identical conditions: 6 seconds duration, 64 concurrent connections.
        </p>
      </div>

      <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <p className="text-sm text-[var(--text-secondary)]">
            <strong className="text-amber-500">Note:</strong> Results were measured at different times and may not be directly comparable.
            Each framework is benchmarked when its code changes.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--bg-secondary)]">
              <tr>
                <TableHeader label="Framework" sortKeyName="framework" />
                <TableHeader label="Language" sortKeyName="language" />
                <TableHeader label="Plaintext req/s" sortKeyName="plaintext_rps" />
                <TableHeader label="Plaintext p95" sortKeyName="plaintext_p95" />
                <TableHeader label="JSON req/s" sortKeyName="json_rps" />
                <TableHeader label="JSON p95" sortKeyName="json_p95" />
                <TableHeader label="Measured" sortKeyName="measured_at" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)]">
              {sortedFrameworks.map((fw, idx) => (
                <tr
                  key={fw.id}
                  className="hover:bg-[var(--bg-secondary)] transition-colors"
                >
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/framework/${fw.id}`}
                        className="font-medium text-[var(--accent)] hover:underline"
                      >
                        {fw.framework}
                      </Link>
                      {fw.url && (
                        <a
                          href={fw.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                          title="View documentation"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                      {fw.language}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                          style={{ width: `${(fw.plaintext_rps / maxPlaintextRps) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm font-medium">
                        {formatNumber(fw.plaintext_rps)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm">
                    {formatLatency(fw.plaintext_p95)}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                          style={{ width: `${(fw.json_rps / maxJsonRps) * 100}%` }}
                        />
                      </div>
                      <span className="font-mono text-sm font-medium">
                        {formatNumber(fw.json_rps)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm">
                    {formatLatency(fw.json_p95)}
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                    {formatDate(fw.measured_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {index && (
        <div className="mt-8 text-center text-sm text-[var(--text-secondary)]">
          <p>
            Last updated: {formatDate(index.generated_at)} · Contract version: {index.contract_version}
          </p>
        </div>
      )}
    </div>
  );
}
